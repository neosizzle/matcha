const enums = require("../constants/enums")
const neo4j_calls = require("../neo4j/calls")
const auth_check_mdw = require("../middleware/authcheck")
const profile_check_mdw = require("../middleware/interactioncheck")

var express = require('express');
var router = express.Router();
var debug = require('debug')('backend:router:matching');

// Get likes, matches and views for user
router.get('/likes_matches_views', [auth_check_mdw.checkJWT], async function(req, res, next) {
  try {
    const id = req.user.id
    const likes = await neo4j_calls.get_likes({id})
    const matches = await neo4j_calls.get_matches({id})
    const views = await neo4j_calls.get_views({id})
    res.send({'data': {
      likes,
      matches,
      views
    }});

  } catch (error) {
    if (error.message == enums.DbErrors.NOTFOUND)
      return res.status(404).send({'detail': "user not found"})
    debug(error)
    return res.status(500).send({'detail' : "Internal server error"});
  }
});

// Get matches for user
router.get('/matches', [auth_check_mdw.checkJWT], async function(req, res, next) {
  try {
    const id = req.user.id
    const matches = await neo4j_calls.get_matches({id})
    res.send({'data': matches});

  } catch (error) {
    if (error.message == enums.DbErrors.NOTFOUND)
      return res.status(404).send({'detail': "user not found"})
    debug(error)
    return res.status(500).send({'detail' : "Internal server error"});
  }
});

// Gets the users this current user had liked
router.get('/likes_by_me', [auth_check_mdw.checkJWT], async function(req, res, next) {
  try {
    const id = req.user.id
    const liked = await neo4j_calls.get_likes_by_me({id})
    res.send({'data': liked});

  } catch (error) {
    if (error.message == enums.DbErrors.NOTFOUND)
      return res.status(404).send({'detail': "user not found"})
    debug(error)
    return res.status(500).send({'detail' : "Internal server error"});
  }
});

// Search for user based on criteria
router.post('/search', [auth_check_mdw.checkJWT], async function(req, res, next) {
  const body = req.body;
  const required_fields = ['sort_key', 'sort_dir', 'age_range', 'loc_range', 'fame_range', 'common_tag_range', 'genders']
  const RANGE_ARRAYS = ['age_range', 'fame_range', 'common_tag_range']
  const ALLOWED_SORT_KEYS = ['age', 'location_diff', 'fame_rating', 'common_tag_count']
  const ALLOWED_SORT_DIR = ['asc', 'desc']

  if (!required_fields.every(key => key in body))
    return res.status(400).send({'detail': `fields ${required_fields} are required`})

  if (!ALLOWED_SORT_KEYS.includes(body['sort_key']))
    return res.status(400).send({'detail': `allowed sort keys are ${ALLOWED_SORT_KEYS}`})

  if (!ALLOWED_SORT_DIR.includes(body['sort_dir']))
    return res.status(400).send({'detail': `allowed sort directions are ${ALLOWED_SORT_DIR}`})

  for (let i = 0; i < RANGE_ARRAYS.length; i++) {
    const range_name = RANGE_ARRAYS[i];
    if (!(Array.isArray(body[range_name]) && body[range_name].length === 2 && Number.isInteger(body[range_name][0]) && Number.isInteger(body[range_name][1]))) {
      return res.status(400).send({'detail': `${range_name} needs to be a 2 element number array`})
    }
    if (body[range_name][0] >= body[range_name][1])
      return res.status(400).send({'detail': `${range_name} should in in [min, max]`})
  }

  if (!Number.isInteger(body['loc_range']))
    return res.status(400).send({'detail': `loc_range needs to be a number`})

  for (let i = 0; i < body['genders'].length; i++) {
    const gender = body['genders'][i];
    if (!Object.values(enums.GENDER).includes(gender))
      return res.status(400).send({'detail': `${gender} not valid`})
  }

  try {
    // convert location range from km to degrees.
    // 1 degree of latitude ≈ 111.32 km
    // 1 degree of longitude ≈ 111.32 km × cos(latitude)
    const kmToLatLonDelta = (r, lat) => ({ latDelta: r / 111.32, lonDelta: r / (111.32 * Math.cos(lat * Math.PI / 180)) });
    const user_latitude = req.user.enable_auto_location? req.user.location_auto_lat : req.user.location_manual_lat
    const user_lonitude = req.user.enable_auto_location? req.user.location_auto_lon : req.user.location_manual_lon
    const {latDelta, lonDelta} = kmToLatLonDelta(body['loc_range'], user_latitude)
    const loc_range_delta = [[user_latitude - latDelta, user_latitude + latDelta], [user_lonitude - lonDelta, user_lonitude + lonDelta]]

    const users = await neo4j_calls.search_with_filters({
      sort_dir: body['sort_dir'],
      sort_key: body['sort_key'],
      age_range: body['age_range'],
      common_tag_range: body['common_tag_range'],
      fame_range: body['fame_range'],
      genders: body['genders'],
      user_common_tags: req.user.tags,
      loc_range: loc_range_delta,
      user_lat: user_latitude,
      user_lon: user_lonitude,
      user_id: req.user.id
    })
    
    res.status(200).send({'data': users})

  } catch (error) {
    debug(error)
    return res.status(500).send({'detail' : "Internal server error"});
  }
});

// Get user suggestions
router.post('/suggest', [auth_check_mdw.checkJWT, profile_check_mdw.checkProfile], async function(req, res, next) {
  const body = req.body;
  const required_fields = ['age_range', 'loc_range', 'fame_range', 'common_tag_range', 'genders']
  const RANGE_ARRAYS = ['age_range', 'fame_range', 'common_tag_range']

  if (!required_fields.every(key => key in body))
    return res.status(400).send({'detail': `fields ${required_fields} are required`})

  for (let i = 0; i < RANGE_ARRAYS.length; i++) {
    const range_name = RANGE_ARRAYS[i];
    if (!(Array.isArray(body[range_name]) && body[range_name].length === 2 && Number.isInteger(body[range_name][0]) && Number.isInteger(body[range_name][1]))) {
      return res.status(400).send({'detail': `${range_name} needs to be a 2 element number array`})
    }
    if (body[range_name][0] >= body[range_name][1])
      return res.status(400).send({'detail': `${range_name} should in in [min, max]`})
  }

  if (!Number.isInteger(body['loc_range']))
    return res.status(400).send({'detail': `loc_range needs to be a number`})

  for (let i = 0; i < body['genders'].length; i++) {
    const gender = body['genders'][i];
    if (!Object.values(enums.GENDER).includes(gender))
      return res.status(400).send({'detail': `${gender} not valid`})
  }

  try {
    // convert location range from km to degrees.
    // 1 degree of latitude ≈ 111.32 km
    // 1 degree of longitude ≈ 111.32 km × cos(latitude)
    const kmToLatLonDelta = (r, lat) => ({ latDelta: r / 111.32, lonDelta: r / (111.32 * Math.cos(lat * Math.PI / 180)) });
    const user_latitude = req.user.enable_auto_location? req.user.location_auto_lat : req.user.location_manual_lat
    const user_lonitude = req.user.enable_auto_location? req.user.location_auto_lon : req.user.location_manual_lon
    const {latDelta, lonDelta} = kmToLatLonDelta(body['loc_range'], user_latitude)
    const loc_range_delta = [[user_latitude - latDelta, user_latitude + latDelta], [user_lonitude - lonDelta, user_lonitude + lonDelta]]

    // query 3 sets of users based on matching criteria
    // loaiton prox, # commin tags and fame rating
    const location_users = await neo4j_calls.search_with_filters({
      sort_dir: "asc",
      sort_key: "loc_range",
      age_range: body['age_range'],
      common_tag_range: body['common_tag_range'],
      fame_range: body['fame_range'],
      genders: body['genders'],
      user_common_tags: req.user.tags,
      loc_range: loc_range_delta,
      user_lat: user_latitude,
      user_lon: user_lonitude,
      user_id: req.user.id
    })

    const tag_users = await neo4j_calls.search_with_filters({
      sort_dir: "asc",
      sort_key: "common_tag_count",
      age_range: body['age_range'],
      common_tag_range: body['common_tag_range'],
      fame_range: body['fame_range'],
      genders: body['genders'],
      user_common_tags: req.user.tags,
      loc_range: loc_range_delta,
      user_lat: user_latitude,
      user_lon: user_lonitude,
      user_id: req.user.id
    })

    const fame_users = await neo4j_calls.search_with_filters({
      sort_dir: "asc",
      sort_key: "fame_rating",
      age_range: body['age_range'],
      common_tag_range: body['common_tag_range'],
      fame_range: body['fame_range'],
      genders: body['genders'],
      user_common_tags: req.user.tags,
      loc_range: loc_range_delta,
      user_lat: user_latitude,
      user_lon: user_lonitude,
      user_id: req.user.id
    })
    
    // right now just naively concat the multiple criteria..
    // possible improvement would be using statistical resampling with custom weights
    const merged = [...location_users, ...tag_users, ...fame_users];
    const users = [
      ...new Map(merged.map(item => [item.id, item])).values()
    ];

    res.status(200).send({'data': users})

  } catch (error) {
    debug(error)
    return res.status(500).send({'detail' : "Internal server error"});
  }
});

module.exports = router;