const neo4j_calls = require("../neo4j/calls")

exports.checkJWT = async (req, res, next) => {
	const token = req.cookies.token;
  
	if (!token) {
	  return res.status(401).json({ 'detail': 'Unauthorized' });
	}
  
	try {
		try {
			req.user = await neo4j_calls.verify_session_with_user({token})
			next()
		} catch (error) {
			return res.status(400).json({ 'detail' : 'Unauthorized' });
		}
	} catch (err) {
		debug(err)
		return res.status(500).json({ 'detail': 'Internal server error' });
	}
  };