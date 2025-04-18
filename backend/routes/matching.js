const enums = require("../constants/enums")
const neo4j_calls = require("../neo4j/calls")
const auth_check_mdw = require("../middleware/authcheck")
const upload_img_mdw = require("../middleware/fileupload")

var express = require('express');
var router = express.Router();
var debug = require('debug')('backend:router:auth');

// Get likes and matches for user
router.get('/me', [auth_check_mdw.checkJWT], async function(req, res, next) {
  res.send({'data': req.user});
});

module.exports = router;