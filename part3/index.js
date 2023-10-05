const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
require('dotenv').config()

const app = express()

app.use(cors())

app.use(express.static('dist'))
app.use(express.json());



morgan.token('req-body', (req) => JSON.stringify(req.body));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :req-body'));


const Person = require('./models/persons')


app.get('/info', (request, response) => {
    // const length = Person.count({}, function(err, count){
    //     return count;
    // })
    Person.count({}).then(length => {
        const now = new Date();

        // Format date using Intl.DateTimeFormat
        const formatter = new Intl.DateTimeFormat('en-US', {
          weekday: 'short', // Abbreviated day name (Sun, Mon)
          month: 'short',   // Abbreviated month name
          day: 'numeric',   // Day of the month
          year: 'numeric',  // Full year
          hour: 'numeric',  // Hours (12-hour format)
          minute: 'numeric',// Minutes
          second: 'numeric',// Seconds
          timeZoneName: 'short', // Timezone abbreviation (CEST, GMT, etc.)
        });
      
        const formattedDate = formatter.format(now);
      
        const html = `<!DOCTYPE html>
        <html>
            <head><title>Phonebook</title></head>
            <body>
                <p>Phonebook has info for ${length} people</p>
                <p>${formattedDate}</p>
            </body>
        </html>`
        ;
        response.send(html);
    })

})


app.get('/api/persons', (request, response) => {
    Person.find({}).then(persons => {
        response.json(persons)
    })
})


app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id).then(person => {
        if (person){
            response.json(person)
        }
        else{
            response.status(404).end()
        }
    })
    .catch(error => next(error))

});

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndRemove(request.params.id)
    .then(result => {
        response.status(204).end()
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    const body = request.body
    const person = {
        name: body.name,
        number: body.number
    }
    Person.findByIdAndUpdate(request.params.id, person, {new: true})
    .then(updatedPerson => {
        response.json(updatedPerson)
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response) => {
    const body = request.body


    if (!body || !body.name || !body.number) {
        return response.status(400).json({ 
            error: 'name/number missing' 
        })
    }

    const person = new Person({
        name: body.name,
        number: body.number
    })

    person.save().then(savedPerson => {
        response.json(savedPerson)
    })

})

const errorHandler = (error, request, response, next) => {
    console.error(error.message)
  
    if (error.name === 'CastError') {
      return response.status(400).send({ error: 'malformatted id' })
    } 
  
    next(error)
}

// this has to be the last loaded middleware.
app.use(errorHandler)


const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})  