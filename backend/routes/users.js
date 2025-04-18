const enums = require("../constants/enums")
const neo4j_calls = require("../neo4j/calls")
const auth_check_mdw = require("../middleware/authcheck")
const upload_img_mdw = require("../middleware/fileupload")

var express = require('express');
var router = express.Router();
var debug = require('debug')('backend:router:auth');

router.get('/me', [auth_check_mdw.checkJWT], async function(req, res, next) {
  res.send({'data': req.user});
});

router.post('/upload_img', [auth_check_mdw.checkJWT], async function(req, res, next) {
  // this indirection exists because multer sends 500 errors by default
  upload_img_mdw.uploadImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ 'detail': 'No file uploaded' });
    }
    return res.send({'data': req.file});
  })
});

router.put('/me', [auth_check_mdw.checkJWT], async function(req, res, next) {
  const body = req.body;
  const required_fields = ['images', 'sexuality', 'displayname', 'bio', 'enable_auto_location', 'gender']

  if (!required_fields.every(key => key in body))
    return res.status(400).send({'detail': `fields ${required_fields} are required`})

  try {
    const images = body['images']
    const tags = body['tags']
    const sexuality = body['sexuality']
    const displayname = body['displayname']
    const bio = body['bio']
    const enable_auto_location = body['enable_auto_location']
    const gender = body['gender']
    const id = req.user.id

    // Some validation
    if (displayname == "")
      return res.status(400).send({"detail": 'display name must not be blank'})
  
    if (!Object.values(enums.GENDER).includes(gender))
      return res.status(400).send({"detail": 'invalid gender'})

    await neo4j_calls.update_user({id: `${id}`, images, sexuality, displayname, bio, tags, enable_auto_location, gender})
		return res.status(200).send({"data": {}})
  } catch (error) {
      if (error.message == enums.DbErrors.NOTFOUND)
              return res.status(404).send({'detail': "user not found"})
      debug(error)
      return res.status(500).send({'detail' : "Internal server error"});
  }
});

module.exports = router;
