const neo4j_calls = require("../neo4j/calls")
const enums = require("../constants/enums")
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const bcrypt = require("bcryptjs");
var debug = require('debug')('backend:router:auth');

var router = express.Router();

router.post('/login', async function(req, res, next) {
	// TODO code here...
	res.send('OK');
});

router.post('/logout', async function(req, res, next) {
	// TODO code here...
	res.send('OK');
});

router.post('/verify_email', async function(req, res, next) {
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
		debug(error)
		if (error.message == enums.DbErrors.EXISTS)
			return res.status(400).send({'detail': "Email already taken"})
		res.status(500).send({'detail' : "Internal server error"});
	}

});

module.exports = router; 