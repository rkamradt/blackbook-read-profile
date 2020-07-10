import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
const OktaJwtVerifier = require('@okta/jwt-verifier')

const oktaJwtVerifier = new OktaJwtVerifier({
  clientId: '0oag1oxllhj9N2SPV4x6',
  issuer: 'https://dev-804011.okta.com/oauth2/default'
});

/**
 * A simple middleware that asserts valid access tokens and sends 401 responses
 * if the token is not present or fails validation.  If the token is valid its
 * contents are attached to req.jwt
 */
function authenticationRequired(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const match = authHeader.match(/Bearer (.+)/)

  if (!match) {
    res.status(401)
    return next('Unauthorized')
  }

  const accessToken = match[1];
  const audience = 'api://default'
  return oktaJwtVerifier.verifyAccessToken(accessToken, audience)
    .then((jwt) => {
      req.jwt = jwt
      next()
    })
    .catch((err) => {
      res.status(401).send(err.message)
    })
}

var app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.get('/users', authenticationRequired, (req, res) => {
  res.json(req.jwt);
})

const { PORT = 3000 } = process.env

app.listen(PORT, () => console.log(`blackbook-read-profile listening on port ${PORT}!`))
