const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Matching service')
})

app.get('/ping', (req, res) => {
    res.send("pong")
})

app.post('/getMatch', (req, res) => {
  req.get("mode")
})

app.listen(port, () => {
  console.log(`Matching service listening on port ${port}`)
})
