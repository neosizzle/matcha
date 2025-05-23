const { DbErrors } = require("../constants/enums");
const neo4j_calls = require("../neo4j/calls")
const enums = require("../constants/enums")
var debug = require('debug')('middleware:intercheck');

exports.checkProfile = async (req, res, next) => {
	const user = req.user
  
	if (!user) {
	  return res.status(400).json({ 'detail': 'No user detected' });
	}
  
	try {
		const user_images = user.images.split(",").filter((x) => x !== "")
		console.log(user.images)
		if (user_images.length == 0)
			return res.status(400).json({ 'detail' : 'Profile is not complete' });
		if (!user.iden_42 && !user.verified)
			return res.status(400).json({ 'detail' : 'Email is not verified' });
		next()
	} catch (err) {
		debug(err)
		return res.status(500).json({ 'detail': 'Internal server error' });
	}
};

exports.checkProfileWs = async (user_id) => {
	try {
		const user = await neo4j_calls.get_user({id: user_id})
		const user_images = user.images.split(",")
		if (user_images.length == 0)
			throw new Error(enums.DbErrors.NOTFOUND);
		if (!user.iden_42 && !user.verified)
			throw new Error(enums.DbErrors.UNAUTHORIZED);
	} catch (error) {
		throw error;
	}
	
};
