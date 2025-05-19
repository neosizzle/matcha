const sqlite_calls = require("../sqlite/calls")
const auth_check_mdw = require("../middleware/authcheck")
const enums = require("../constants/enums")
const neo4j_calls = require("../neo4j/calls")

var express = require('express');
var router = express.Router();

// Get location of all users, to be scrapped, use neo4j instead
router.get('/all', [auth_check_mdw.checkJWT], async function(req, res, next) {
  try {
    const users = sqlite_calls.get_all_users_location.all(id)
    res.send({'data': users});
    // add parsing to only get location and id
  } catch (error) {
    debug(error)
    return res.status(500).send({'detail' : "Internal server error"});
  }
});