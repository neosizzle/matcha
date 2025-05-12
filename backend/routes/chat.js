const enums = require("../constants/enums")
const sqlite_calls = require("../sqlite/calls")
const auth_check_mdw = require("../middleware/authcheck")

var express = require('express');
var router = express.Router();
var debug = require('debug')('backend:router:chat');

// Get full chat history for a user
router.get('/history/:id', [auth_check_mdw.checkJWT], async function(req, res, next) {
  try {
	const opp_id = req.params.id
	const id = req.user.id
	const chats = sqlite_calls.get_chats_by_uid.all(
		opp_id, id, opp_id, id
	)
	res.send({'data': chats});

  } catch (error) {
	debug(error)
	return res.status(500).send({'detail' : "Internal server error"});
  }
});

// get chat previews for current user
router.get('/preview', [auth_check_mdw.checkJWT], async function(req, res, next) {
	try {
	  const id = req.user.id
	  const chats = sqlite_calls.get_latest_conversations_by_user.all(
		  id, id
	  )
	  res.send({'data': chats});
  
	} catch (error) {
	  debug(error)
	  return res.status(500).send({'detail' : "Internal server error"});
	}
  });

module.exports = router;