var express = require('express');
var router = express.Router();
const neo4j_calls = require("../neo4j/calls")

/* GET users listing. */
router.get('/', async function(req, res, next) {
  let result = await neo4j_calls.get_num_nodes();
  console.log("RESULT IS", result)
  res.send('respond with a resource');
});

module.exports = router;
