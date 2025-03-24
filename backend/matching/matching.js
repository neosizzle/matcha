const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Matching service')
})

app.listen(port, () => {
  console.log(`Matching service listening on port ${port}`)
})