const enums = require("../constants/enums")
const neo4j_calls = require("../neo4j/calls")
const auth_check_mdw = require("../middleware/authcheck")
const upload_img_mdw = require("../middleware/fileupload")

var express = require('express');
const { DATE_REGEX } = require("../constants/regex");
var router = express.Router();
var debug = require('debug')('backend:router:users');

router.get('/me', [auth_check_mdw.checkJWT], async function(req, res, next) {
  res.send({'data': req.user});
});

router.post('/upload_img', [auth_check_mdw.checkJWT], async function(req, res, next) {
  // this indirection exists because multer sends 500 errors by default
  upload_img_mdw.uploadImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({ 'detail': err.message });
    }
    if (!req.file) {
      return res.status(400).json({ 'detail': 'No file uploaded' });
    }
    return res.send({'data': req.file});
  })
});

router.put('/me', [auth_check_mdw.checkJWT], async function(req, res, next) {
  const body = req.body;
  const required_fields = ['images', 'sexuality', 'displayname', 'bio', 'enable_auto_location', 'gender', 'location_manual', 'email', 'birthday', 'location_manual_lon', 'location_manual_lat', 'location_auto_lon', 'location_auto_lat']

  if (!required_fields.every(key => key in body))
    return res.status(400).send({'detail': `fields ${required_fields} are required`})

  try {
    const images = body['images']
    const tags = body['tags']
    const sexuality = body['sexuality']
    const displayname = body['displayname']
    const bio = body['bio']
    const enable_auto_location = body['enable_auto_location']
    const gender = body['gender']
    const email = body['email']
    const location_manual = body['location_manual']
    const location_manual_lon = body['location_manual_lon']
    const location_manual_lat = body['location_manual_lat']
    const location_auto_lon = body['location_auto_lon']
    const location_auto_lat = body['location_auto_lat']
    const birthday = body['birthday']
    
    const id = req.user.id

    // Some validation
    if (displayname == "")
      return res.status(400).send({"detail": 'display name must not be blank'})
  
    if (!Object.values(enums.GENDER).includes(gender))
      return res.status(400).send({"detail": 'invalid gender'})

    if (!DATE_REGEX.test(birthday))
        return res.status(400).send({'detail': `birthday is invalid, format YYYY-MM-DD is required`})

    const bd_day = new Date(birthday);
    const today = new Date();
    const bd_requirement = today.setFullYear(today.getFullYear() - 18);
    if (isNaN(bd_day.getTime()))
      return res.status(400).send({'detail': `birthday is invalid`})
  
    if (bd_day < bd_requirement)
      return res.status(400).send({'detail': `Too old, this platform is made for minors only`})

    
    
    const isValidLatitude = (lat) => (typeof lat === 'number' && lat >= -90 && lat <= 90);
    const isValidLongitude = (lon) => (typeof lon === 'number' && lon >= -180 && lon <= 180);
    
    const change_man_coords = location_manual_lat != req.user.location_manual_lat || location_manual_lon != req.user.location_manual_lon 
    const change_auto_coords = location_auto_lat != req.user.location_auto_lat || location_auto_lon != req.user.location_auto_lon 

    if (change_man_coords && !(isValidLongitude(parseFloat(location_manual_lon)) && isValidLatitude(parseFloat(location_manual_lat))))
      return res.status(400).send({'detail': `manual coordinates invalid`})

    if (change_auto_coords && !(isValidLongitude(parseFloat(location_auto_lon)) && isValidLatitude(parseFloat(location_auto_lat))))
      return res.status(400).send({'detail': `auto coordinates invalid`})


    const new_user = await neo4j_calls.update_user({id: `${id}`, images, sexuality, displayname, bio, tags, enable_auto_location, gender, location_manual, location_manual_lat, location_manual_lon, location_auto_lat, location_auto_lon, email, birthday})
		return res.status(200).send({"data": new_user})
  } catch (error) {
      if (error.message == enums.DbErrors.NOTFOUND)
        return res.status(404).send({'detail': "user not found"})
      if (error.message == enums.DbErrors.EXISTS)
        return res.status(400).send({'detail': "Email already exists"})
      debug(error)
      return res.status(500).send({'detail' : "Internal server error"});
  }
});

router.get('/:id', [auth_check_mdw.checkJWT], async function(req, res, next) {
  const id = req.params.id

  try {
    const user = await neo4j_calls.get_user({id})
    return res.send({'data': user});
  } catch (error) {
    if (error.message == enums.DbErrors.NOTFOUND)
      return res.status(404).send({'detail': 'user not found'})
    debug(error)
    return res.status(500).send({'detail' : "Internal server error"}); 
  }
});


module.exports = router;
