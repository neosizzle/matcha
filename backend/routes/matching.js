const enums = require("../constants/enums")
const neo4j_calls = require("../neo4j/calls")
const auth_check_mdw = require("../middleware/authcheck")
const upload_img_mdw = require("../middleware/fileupload")

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

module.exports = router;