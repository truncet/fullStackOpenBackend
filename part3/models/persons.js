const mongoose = require('mongoose')

const url = process.env.MONGODB_URI

console.log("Connecting to ", url)

mongoose.set('strictQuery',false)
mongoose.connect(url).then(result => {
    console.log("connected to MongoDb")
}).catch((error) => {
    console.log("error connecting to MongoDB:", error.message)
})

const personsSchema = new mongoose.Schema({
  name: String,
  number: String,
})

personsSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

module.exports = mongoose.model('persons', personsSchema)