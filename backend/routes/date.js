const auth_check_mdw = require("../middleware/authcheck")
const neo4j_calls = require("../neo4j/calls")
const enums = require("../constants/enums")

var express = require('express');
var router = express.Router();
var debug = require('debug')('backend:router:geo');


router.get('/all', [auth_check_mdw.checkJWT], async function(req, res, next) {
	try {
		const data = await neo4j_calls.get_all_dates({user_id: req.user.id})
		return res.send({ 'data': data });
	
	  } catch (error) {
		debug(error)
		res.status(500).send({
		  'detail': error
		});
	  }

});

router.post('/', [auth_check_mdw.checkJWT], async function(req, res, next) {
	const body = req.body;
	const required_fields = ['datetime', 'user_id_2', 'details']

	if (!required_fields.every(key => key in body))
		return res.status(400).send({'detail': `fields ${required_fields} are required`})

	try {
		const user_id = req.user.id
		const user_id_2 = req.body['user_id_2']
		const details = req.body['details']
		const datetime = req.body['datetime']
		const data = await neo4j_calls.create_update_date_with_user({user_id, user_id_2, datetime, details})
		return res.send({ 'data': data });
	
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

router.get('/nearby', [auth_check_mdw.checkJWT], async function(req, res, next) {
	const body = req.query;
	const required_fields = ['lat', 'lon']

	if (!required_fields.every(key => key in body))
		return res.status(400).send({'detail': `fields ${required_fields} are required`})

	try {
		const neo4jCalls = require('../neo4j/calls');
		const lat = parseFloat(req.query.lat);
		const lon = parseFloat(req.query.lon);
		
		if (isNaN(lat) || isNaN(lon)) {
			return res.status(400).send({'detail': 'Invalid lat/lon values'});
		}

		const nearbyUsers = await neo4jCalls.get_nearest_users(lon, lat);
		return res.send({ 'data': JSON.parse(nearbyUsers) });
	
	} catch (error) {
		debug("Error fetching nearby users:", error);
		res.status(500).send({
		  'detail': error.message || 'Error fetching nearby users'
		});
	}
});

module.exports = router;
