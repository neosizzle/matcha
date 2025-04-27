const { DbErrors } = require("../constants/enums");
const neo4j_calls = require("../neo4j/calls")
var debug = require('debug')('middleware:authcheck');


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

  exports.WScheckJWT = async (socket) => {
	const parseCookies = cookieString => cookieString.split(';').reduce((cookies, cookie) => { const [key, value] = cookie.trim().split('='); key && (cookies[key] = decodeURIComponent(value)); return cookies; }, {});
	const cookies = parseCookies(socket.handshake.headers.cookie)
	const token = cookies['token']
	
	if (!token) {
		throw new Error(DbErrors.UNAUTHORIZED)
	}
	
	try {
		try {
			const user =  await neo4j_calls.verify_session_with_user({token})
			return user
		} catch (error) {
			throw new Error(DbErrors.UNAUTHORIZED)
		}
	} catch (err) {
		debug(err)
		throw new Error(DbErrors.MISC)
	}
  };