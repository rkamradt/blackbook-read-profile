import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

var app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.get('/users', function(req, res, next) {
  res.send({
    message: 'hello you so-and-so'
  })
})

const { PORT = 3000 } = process.env

app.listen(PORT, () => console.log(`blackbook-read-profile listening on port ${PORT}!`))
