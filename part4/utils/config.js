require('dotenv').config()

const PORT = process.env.PORT

const MONGODB_URI = process.env === 'test'
  ? process.env.Test_MONGODB_URI
  : process.env.MONGODB_URI

module.exports = {
  MONGODB_URI,
  PORT
}