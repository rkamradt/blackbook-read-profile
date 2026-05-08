import express from 'express'
const MongoClient = require('mongodb').MongoClient
import cors from 'cors'

// JWT validation is handled by the api-gateway (Cloudflare tunnel).
// The gateway sets X-User-ID to the token subject before forwarding.
function authenticationRequired(req, res, next) {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).send('Unauthorized')
    return
  }
  req.userId = userId
  next()
}

const MONGO_USER = process.env.MONGO_USER
const MONGO_PASS = process.env.MONGO_PASS
const MONGO_SERVER = process.env.MONGO_SERVER || 'mongodb-0'
const MONGO_PORT = process.env.MONGO_PORT || 27017

const dbName = 'blackbook'
const mongourl = `mongodb://${MONGO_USER}:${MONGO_PASS}@${MONGO_SERVER}:${MONGO_PORT}`

async function withDb(fn) {
  const client = new MongoClient(mongourl)
  try {
    await client.connect()
    return await fn(client.db(dbName))
  } finally {
    await client.close()
  }
}

async function getUser(req, res) {
  try {
    const user = await withDb(async (db) => {
      const query = { user: req.userId }
      let found = await db.collection('users').findOne(query)
      if (!found) {
        found = { user: req.userId, firstName: '', lastName: '', bio: '', avatarUrl: '' }
        await db.collection('users').insertOne(found)
      }
      return found
    })
    res.json(user)
  } catch (err) {
    console.error(err.stack)
    res.status(500).send('Internal Server Error')
  }
}

async function updateUser(req, res) {
  try {
    const { firstName, lastName, bio, avatarUrl } = req.body
    const updated = await withDb(async (db) => {
      return db.collection('users').findOneAndUpdate(
        { user: req.userId },
        { $set: { firstName, lastName, bio, avatarUrl } },
        { upsert: true, returnDocument: 'after' }
      )
    })
    res.json(updated)
  } catch (err) {
    console.error(err.stack)
    res.status(500).send('Internal Server Error')
  }
}

var app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.get('/users', authenticationRequired, getUser)
app.put('/users', authenticationRequired, updateUser)

const { PORT = 3000 } = process.env

app.listen(PORT, () => console.log(`blackbook-read-profile listening on port ${PORT}!`))
