const neo4j_calls = require("../neo4j/calls")
const enums = require("../constants/enums")
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const bcrypt = require("bcryptjs");
var debug = require('debug')('backend:router:auth');

var router = express.Router();

const ACCEPTED_LOGIN_METHODS = ['email', "42"]

router.post('/login', async function(req, res, next) {
	const body = req.body
	const method = body['method']

	if (!method)
		return res.status(400).send({'detail': `method field is required`})
	if (!ACCEPTED_LOGIN_METHODS.includes(method))
		return res.status(400).send({'detail': `Accepted methods are ${ACCEPTED_LOGIN_METHODS}`})

	if (method == ACCEPTED_LOGIN_METHODS[0]) // email
	{
		const required_fields = ["email", "password"]
		if (!required_fields.every(key => key in body))
			return res.status(400).send({'detail': `fields ${required_fields} are required`})

		const email = body['email']
		const password = body['password']

		try {
			// query db for email and password
			const user = await neo4j_calls.auth_email_pw({email, password})

			// TODO: create new session

			return res.status(200).send({'data': {'user': user}});
		} catch (error) {
			if (error.message == enums.DbErrors.NOTFOUND)
				return res.status(404).send({'detail': "Email not found"})
			if (error.message == enums.DbErrors.UNAUTHORIZED)
				return res.status(403).send({'detail': "Credentials invalid"})
			debug(error)
			return res.status(500).send({'detail' : "Internal server error"});
		}
		
	}
	res.status(501).send({'detail': "Not implemented"});
});

router.post('/logout', async function(req, res, next) {
	// TODO code here...
	res.send('OK');
});

router.post('/verify_email', async function(req, res, next) {
	// TODO code here...
	res.send('OK');
});

router.post('/request_verify_email', async function(req, res, next) {
	// TODO code here...
	res.send('OK');
});


router.post('/register', async function(req, res, next) {
	const required_fields = ["email", "password", "displayname", "birthday"]
	const body = req.body
	
	if (!required_fields.every(key => key in body))
		return res.status(400).send({'detail': `required fields are ${required_fields}`})
	
	const { email, password, displayname, birthday } = body

	const email_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	const password_regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
	const date_regex = /^\d{4}-\d{2}-\d{2}$/;

	if (!email_regex.test(email))
		return res.status(400).send({'detail': `email is invalid`})

	if (!password_regex.test(password))
		return res.status(400).send({'detail': `password should have more than 7 characters, at least 1 uppercase, 1 lowercase, 1 number and 1 special character`})

	if (!date_regex.test(birthday))
		return res.status(400).send({'detail': `birthday is invalid, format YYYY-MM-DD is required`})

	const bd_day = new Date(birthday);
	const today = new Date();
	const bd_requirement = today.setFullYear(today.getFullYear() - 18);
	if (isNaN(bd_day.getTime()))
		return res.status(400).send({'detail': `birthday is invalid`})

	if (bd_day < bd_requirement)
		return res.status(400).send({'detail': `Too old, this platform is made for minors only`})

	const salt = bcrypt.genSaltSync(10);
	const new_user = {
		id: uuidv4(),
		images: "",
		email,
		password: bcrypt.hashSync(password, salt),
		iden_42: null,
		verified: false,
		sexuality: enums.Sexuality.BISEXUAL,
		displayname,
		birthday,
		bio: "",
		enable_auto_location: true,
		fame_rating: 0
	}

	try {
		await neo4j_calls.create_new_user(new_user);
		res.send({'data': new_user})
	} catch (error) {
		if (error.message == enums.DbErrors.EXISTS)
			return res.status(400).send({'detail': "Email already taken"})
		debug(error)
		return res.status(500).send({'detail' : "Internal server error"});
	}

});

module.exports = router; 