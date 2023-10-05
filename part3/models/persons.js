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
  name: {
    type: String,
    minLength: 3,
    required: true
  },
  number: {
    type: String,
    minLength: 8,
    validate: {
        validator: function (v){
            return /^\d{2,3}-\d+$/.test(v);
        },
        message: props => `${props.value} is not a valid phone number!`

    }
  },
})

personsSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

module.exports = mongoose.model('persons', personsSchema)