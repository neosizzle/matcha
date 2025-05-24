const auth_check_mdw = require("../middleware/authcheck")

var express = require('express');
var router = express.Router();
var debug = require('debug')('backend:router:geo');


router.get('/ip', [auth_check_mdw.checkJWT], async function(req, res, next) {
	try {
		// Dynamically import node-fetch
		const { default: fetch } = await import('node-fetch');
	
		// const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress; // nOTE: use this on remote deployment
		// const response = await fetch(`https://api.geoapify.com/v1/ipinfo?apiKey=${process.env.GEOAPIFY_API_KEY}&ip=${clientIp}`);

		const response = await fetch(`https://api.geoapify.com/v1/ipinfo?apiKey=${process.env.GEOAPIFY_API_KEY}`); // assume server and client is same machine (localhost)

		if (!response.ok) {
			return res.status(500).send({'detail' : 'geoapify failed'})
		}
	
		const data = await response.json();
		let location_name = `${data['city']['name']}, ${data['state']? data['state']['name'] + ',': ''} ${data['country']['name']}`;
		return res.send({ 'data': {
			longitude: data['location']['longitude'],
			latitude: data['location']['latitude'],
			name: location_name
		} });
	
	  } catch (error) {
		debug(error)
		res.status(500).send({
		  'detail': error
		});
	  }

});

router.get('/coords', [auth_check_mdw.checkJWT], async function(req, res, next) {
	const body = req.query;
	const required_fields = ['lat', 'lon']

  	if (!required_fields.every(key => key in body))
		return res.status(400).send({'detail': `fields ${required_fields} are required`})

	try {
		// Dynamically import node-fetch
		const { default: fetch } = await import('node-fetch');

		const response = await fetch(`https://api.geoapify.com/v1/geocode/reverse?apiKey=${process.env.GEOAPIFY_API_KEY}&lat=${req.query['lat']}&lon=${req.query['lon']}&format=json`);

		if (!response.ok) {
			return res.status(500).send({'detail' : 'geoapify failed'})
		}
	
		const data = await response.json();
		
		return res.send({ 'data': {
			longitude: req.query['lon'],
			latitude: req.query['lat'],
			name: `${data['results'][0]['address_line1']}, ${data['results'][0]['address_line2']}`
		} });
	
	  } catch (error) {
		res.status(500).send({
		  'detail': error
		});
	  }

});

module.exports = router;
