const enums = require("../constants/enums")
const sqlite_calls = require("../sqlite/calls")
const auth_check_mdw = require("../middleware/authcheck")
const Groq = require("groq-sdk");
const z = require("zod");

var express = require('express');
var router = express.Router();
var debug = require('debug')('backend:router:chat');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

// AI rizz 
router.get('/rizz/:id', [auth_check_mdw.checkJWT], async function(req, res, next) {

	try {
		const opp_id = req.params.id
		const id = req.user.id
		const chats = sqlite_calls.get_chats_by_uid.all(
		opp_id, id, opp_id, id
		)
		let chats_processed = chats.map(e => {
			return {
				'from': e['from_id'] == req.user.id? 'me': 'other person',
				'contents': 'contents'
			}
		})

		// let chats_processed =[
		// 	{
		// 		'from': "other person",
		// 		'contents': 'im tired and bored😔'
		// 	},
		// 	{
		// 		'from': "other person",
		// 		'contents': 'im broke too...'
		// 	}
		// ]

		const last_n = 10
		chats_processed = chats_processed.length < last_n ? chats_processed : chats_processed.slice(-last_n);
		
		const schema = z.object({
			msg: z.string()
		  });
		const completion = await groq.chat.completions.create({
			messages: [
			  {
				role: "system",
				content: `You are a flirter with a cheesy and funny personality, 
				you will be provided with a message history in the form of a JSON array like so: 
				[
				{
				"from": "me" | "other person",
				"contents": "string"
				}
				]. Suggest the best response for "me" with pick up likes preferred
				always respond with valid JSON objects that match this structure:
				{
				"msg": "string"
				}
				Your response should ONLY contain the JSON object and nothing else.`,
			  },
			  {
				role: "user",
				content: JSON.stringify(chats_processed),
			  },
			],
			model: "llama-3.3-70b-versatile",
			response_format: { type: "json_object" },

		  });

		const responseContent = completion.choices[0].message.content;
		const jsonData = JSON.parse(responseContent || "");
		const validatedData = schema.parse(jsonData);

		return res.send({ 'data': validatedData });

		} catch (error) {
			if (error.message == enums.DbErrors.NOTFOUND)
				return res.status(404).send({'detail': "user not found"})
			if (error.message == enums.DbErrors.EXISTS)
				return res.status(400).send({'detail': "already exists"})
			if (error.message == enums.DbErrors.UNAUTHORIZED)
				return res.status(400).send({'detail': "unauthorized"})
			debug(error)
			return res.status(500).send({'detail' : "Internal server error"});
		}

});
  

module.exports = router;