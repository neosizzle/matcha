const neo4j_calls = require("../neo4j/calls")
const auth_check_mdw = require("../middleware/authcheck")
const enums = require("../constants/enums")

const { v4: uuidv4 } = require('uuid');
const express = require('express');
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const { EMAIL_REGEX, PASSWORD_REGEX, DATE_REGEX } = require("../constants/regex");
var debug = require('debug')('backend:router:auth');
const crypto = require('crypto');
const querystring = require('querystring');


var router = express.Router();

const ACCEPTED_LOGIN_METHODS = ['email', "42"]
const COOKIE_AGE_MILLISECONDS = 12 * 60 * 60 * 1000
const INTRA_42_AUTH_URL = "https://api.intra.42.fr/oauth/authorize"
const INTRA_42_TOKEN_URL = 'https://api.intra.42.fr/oauth/token'
const INTRA_42_IDEN_URL = 'https://api.intra.42.fr/v2/me'

const EMAIL_TRANSPORTER = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: process.env.ETHEREAL_EMAIL,
        pass: process.env.ETHEREAL_PW
    }
});

router.get('/oauth42', async function(req, res) {
	const params = {
		scope: 'public',
		state: `42_${ crypto.createHash('sha256').update('i am inside ur walls').digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`,
		client_id: process.env.CLIENT_ID_42,
		response_type: 'code',
		redirect_uri: process.env.OAUTH_REDIR_URL
	}
    const params_encoded = querystring.stringify(params);
    return res.redirect(`${INTRA_42_AUTH_URL}?${params_encoded}`);
})

router.post('/login', async function(req, res) {
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
			const user = await neo4j_calls.auth_email_pw({email, password})
			const session = await neo4j_calls.create_session_with_user({user_id: user.id})
			res.cookie('token', session['hash'], {sameSite: "strict", httpOnly: true, maxAge: COOKIE_AGE_MILLISECONDS})
			return res.status(200).send({'data': {'user': user, 'token': session['hash']}});
		} catch (error) {
			if (error.message == enums.DbErrors.NOTFOUND)
				return res.status(404).send({'detail': "Email not found"})
			if (error.message == enums.DbErrors.UNAUTHORIZED)
				return res.status(403).send({'detail': "Credentials invalid"})
			debug(error)
			return res.status(500).send({'detail' : "Internal server error"});
		}
		
	}
	if (method == ACCEPTED_LOGIN_METHODS[1]) // 42 API
	{
		const required_fields = ["code", "state"]
		if (!required_fields.every(key => key in body))
			return res.status(400).send({'detail': `fields ${required_fields} are required`})

		const code = body['code']
		const state = body['state']

		// send request to 42 oauth to obtain token
		let params = {
			'client_id': process.env.CLIENT_ID_42,
			'client_secret': process.env.CLIENT_SECRET_42,
			'grant_type': 'authorization_code',
			'code': code,
			'state': state,
			'redirect_uri': process.env.OAUTH_REDIR_URL
		}

		const params_encoded = querystring.stringify(params)
		let response = await fetch(`${INTRA_42_TOKEN_URL}?${params_encoded}`, {'method': 'POST'});
		let response_body = await response.json()
		if (response.status != 200)
			return res.status(403).send({'detail' : "Unauthorized"});

		const oauth_token = response_body['access_token']
		let headers = {
			'Authorization': `Bearer ${oauth_token}`
		}

		// use token to get oauth identity
		response = await fetch(INTRA_42_IDEN_URL, {'method': 'GET', 'headers': headers});
		response_body = await response.json()

		if (response.status != 200)
			return res.status(403).send({'detail' : "Unauthorized"});

		const user_bd_string = response_body['cursus_users'][0]['begin_at']
		const user_bd = new Date(user_bd_string).toISOString().split('T')[0];
		const today = new Date()
		const user_iden = response_body['login']
		const bd_requirement = today.setFullYear(today.getFullYear() - 18);

		if (user_bd < bd_requirement)
			return res.status(400).send({'detail': `Too old, this platform is made for minors only`})

		try {
			console.log(user_iden)
			const user = await neo4j_calls.get_or_create_user_42({user_iden, birthday: user_bd})
			const session = await neo4j_calls.create_session_with_user({user_id: user.id})
			res.cookie('token', session['hash'], {sameSite: "strict", httpOnly: true, maxAge: COOKIE_AGE_MILLISECONDS})
			return res.status(200).send({'data': {'user': user, 'token': session['hash']}});
		} catch (error) {
			debug(error)
			return res.status(500).send({'detail' : "Internal server error"});
		}
	}
});

router.post('/logout', [auth_check_mdw.checkJWT], async function(req, res) {
	try {
		await neo4j_calls.delete_session_from_user({user_id: req.user.id})
		return res.status(200).send({'data': {}})
	} catch (error) {
		if (error.message == enums.DbErrors.NOTFOUND)
			return res.status(404).send({'detail': "Not found"})
		debug(error)
		return res.status(500).send({'detail' : "Internal server error"});
	}
});

router.post('/verify_email',  [auth_check_mdw.checkJWT], async function(req, res) {
	const required_fields = ["otp"]
	const body = req.body
	const user = req.user

	if (!required_fields.every(key => key in body))
		return res.status(400).send({'detail': `required fields are ${required_fields}`})
	
	if (user.verified)
		return res.status(400).send({'detail': `User already verified`})
	
	const { otp } = body

	try {
		await neo4j_calls.verify_email({ user, otp })
		return res.status(200).send({"data": {}})
	} catch (error) {
		if (error.message == enums.DbErrors.EXPIRED)
			return res.status(400).send({'detail': 'Request expired'})
		if (error.message == enums.DbErrors.NOTFOUND)
			return res.status(404).send({'detail': 'Not found'})
		if (error.message == enums.DbErrors.UNAUTHORIZED)
			return res.status(403).send({'detail': 'Invalid OTP'})
		debug(error)
		return res.status(500).send({'detail' : "Internal server error"});
	}
});

router.post('/request_verify_email', [auth_check_mdw.checkJWT], async function(req, res) {
	const recepient_email = req.user.email
	
	if (req.user.verified)
		return res.status(400).send({'detail': `User already verified`})

	if (!recepient_email)
		return res.status(400).send({'detail': 'Oauth accounts does not need email verification'})
	try {
		const otp = await neo4j_calls.create_email_verify({user: req.user})
		const mail_params = {
			from: process.env.ETHEREAL_EMAIL,
			to: recepient_email,
			subject: 'Verication email',
			html: `
				<html>
				<head>
					<style>
					h1 {
						color: #4CAF50;
					}
					p {
						font-size: 16px;
					}
					</style>
				</head>
				<body>
					<h1>Email verification for Matcha</h1>
					<p>Please enter the verification code below to complete your verification. If you did not request this verification, please feel free to safely ignore this email.</p>
					<h2>${otp}</h2>

				</body>
				</html>
			` 
		};
		const info = await EMAIL_TRANSPORTER.sendMail(mail_params);
		if (!info.accepted)
			return res.status(500).send({'detail': "Nodemailer error"});
		return res.status(200).send({'data': {}});
	} catch (error) {
		if (error.message == enums.DbErrors.RATE_LIMIT)
			return res.status(429).send({'detail': 'Too many requests'})
		debug(error)
		return res.status(500).send({'detail' : "Internal server error"});
	}
});


router.post('/register', async function(req, res) {
	const required_fields = ["email", "password", "displayname", "birthday"]
	const body = req.body
	
	if (!required_fields.every(key => key in body))
		return res.status(400).send({'detail': `required fields are ${required_fields}`})
	
	const { email, password, displayname, birthday } = body

	if (!EMAIL_REGEX.test(email))
		return res.status(400).send({'detail': `email is invalid`})

	if (!PASSWORD_REGEX.test(password))
		return res.status(400).send({'detail': `password should have more than 7 characters, at least 1 uppercase, 1 lowercase, 1 number and 1 special character`})

	if (!DATE_REGEX.test(birthday))
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
		fame_rating: 0,
		gender: enums.GENDER.NON_BINARY
	}

	try {
		await neo4j_calls.create_new_user(new_user);
		const session = await neo4j_calls.create_session_with_user({user_id: new_user.id})
		res.cookie('token', session['hash'], {sameSite: "strict", httpOnly: true, maxAge: COOKIE_AGE_MILLISECONDS})
		res.send({'data': {'user': new_user, 'token': session['hash']}})
	} catch (error) {
		if (error.message == enums.DbErrors.EXISTS)
			return res.status(400).send({'detail': "Email already taken"})
		debug(error)
		return res.status(500).send({'detail' : "Internal server error"});
	}

});

router.post('/request_pw_reset', async function(req, res) {
	const required_fields = ["email"]
	const body = req.body

	if (!required_fields.every(key => key in body))
		return res.status(400).send({'detail': `required fields are ${required_fields}`})
	
	const { email } = body

	try {
		const otp = await neo4j_calls.create_pw_reset({ email })
		const mail_params = {
			from: process.env.ETHEREAL_EMAIL,
			to: email,
			subject: 'Password reset email',
			html: `
				<html>
				<head>
					<style>
					h1 {
						color:rgb(175, 76, 76);
					}
					p {
						font-size: 16px;
					}
					</style>
				</head>
				<body>
					<h1>Password reset for Matcha</h1>
					<p>Please enter the verification code below to complete your reset. If you did not request this reset, please feel free to safely ignore this email.</p>
					<h2>${otp}</h2>

				</body>
				</html>
			` 
		};
		const info = await EMAIL_TRANSPORTER.sendMail(mail_params);
		if (!info.accepted)
			return res.status(500).send({'detail': "Nodemailer error"});
		return res.status(200).send({'data': {}});
	} catch (error) {
		if (error.message == enums.DbErrors.NOTFOUND)
			return res.status(404).send({'detail': "Not found"})
		if (error.message == enums.DbErrors.RATE_LIMIT)
			return res.status(429).send({'detail': 'Too many requests'})
		debug(error)
		return res.status(500).send({'detail': "Internal server error"})
	}
});

router.post('/verify_pw_reset', async function(req, res) {
	const required_fields = ["otp", "new_pw", "email"]
	const body = req.body

	if (!required_fields.every(key => key in body))
		return res.status(400).send({'detail': `required fields are ${required_fields}`})
	
	const { otp, new_pw, email } = body

	if (!PASSWORD_REGEX.test(new_pw))
		return res.status(400).send({'detail': `password should have more than 7 characters, at least 1 uppercase, 1 lowercase, 1 number and 1 special character`})

	const salt = bcrypt.genSaltSync(10);
	const hashed_pw = bcrypt.hashSync(new_pw, salt);

	try {
		await neo4j_calls.verify_pw_reset({ new_pw: hashed_pw, otp, email})
		return res.status(200).send({"data": {}})
	} catch (error) {
		if (error.message == enums.DbErrors.EXPIRED)
			return res.status(400).send({'detail': 'Request expired'})
		if (error.message == enums.DbErrors.NOTFOUND)
			return res.status(404).send({'detail': 'Not found'})
		if (error.message == enums.DbErrors.UNAUTHORIZED)
			return res.status(403).send({'detail': 'Invalid OTP'})
		debug(error)
		return res.status(500).send({'detail' : "Internal server error"});
	}

});

module.exports = router; 