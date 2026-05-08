import express from 'express'
import bodyParser from 'body-parser'
const MongoClient = require('mongodb').MongoClient
import cors from 'cors'
const { auth } = require('express-oauth2-jwt-bearer')

const authenticationRequired = auth({
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  audience: process.env.AUTH0_AUDIENCE,
})

const MONGO_USER = process.env.MONGO_USER
const MONGO_PASS = process.env.MONGO_PASS
const MONGO_SERVER = process.env.MONGO_SERVER || 'mongodb-0'
const MONGO_PORT = process.env.MONGO_PORT || 27017

const dbName = 'blackbook'
const mongourl = `mongodb://${MONGO_USER}:${MONGO_PASS}@${MONGO_SERVER}:${MONGO_PORT}`;

const client = new MongoClient(mongourl, {
  useUnifiedTopology: true
})

async function getUser(req, res, next) {
  const client = new MongoClient(mongourl, {
    useUnifiedTopology: true
  })

  try {
    const email = req.auth.payload.sub
    if(!email) {
      console.log('no user in request')
      return next()
    }
    console.log(`Connecting to ${mongourl}`)
    await client.connect()
    console.log('Connected correctly to server')

    const db = client.db(dbName)
    const query = { user: email };
    var user = await db.collection('users').findOne(query);
    if(!user) {
      user = {
        user: email,
        firstName: '',
        lastName: '',
        privateData: 'sample private data'
      }
      const r = await db.collection('users').insertOne(user, {
          w: 'majority',
          wtimeout: 10000,
          serializeFunctions: true,
          forceServerObjectId: true
        }
      )
    }

    res.json(user)
  } catch (err) {
    client.close()
    console.log(err.stack)
  }

  console.log('Closing mongoDB connection')
  client.close()
  console.log('Ending')
}

var app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.get('/users', authenticationRequired, getUser)

const { PORT = 3000 } = process.env

app.listen(PORT, () => console.log(`blackbook-read-profile listening on port ${PORT}!`))
