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


// let persons = [
//     { 
//         "id": 1,
//         "name": "Arto Hellas", 
//         "number": "040-123456"
//     },
//     { 
//         "id": 2,
//         "name": "Ada Lovelace", 
//         "number": "39-44-5323523"
//     },
//     { 
//         "id": 3,
//         "name": "Dan Abramov", 
//         "number": "12-43-234345"
//     },
//     { 
//         "id": 4,
//         "name": "Mary Poppendieck", 
//         "number": "39-23-6423122"
//     } 
// ]

// const generateId = () => {
//     const maxId = persons.length > 0
//         ? Math.max(...persons.map(n => n.id))
//         : 0
//     return maxId + 1
// }

// const alreadyPresent = (name, array) => {
//     for (let i = 0; i < array.length; i++) {
//         if (array[i].name === name) {
//           return true; 
//         }
//       }
//       return false;
// }


app.get('/api/persons', (request, response) => {
    Person.find({}).then(persons => {
        response.json(persons)
    })
})

app.get('/info', (request, response) => {
    const length = Person.count({}, function(err, count){
        return count;
    })

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

app.get('/api/persons/:id', (request, response) => {
    Person.findById(request.params.id).then(person => {
        response.json(person)
    })

    if (person) {
        response.json(person)
    } else {
        response.statusMessage = "Id not found"
        response.status(404).end()
    }
});

app.delete('/api/persons/:id', (request, response) => {
    Person.findById(request.params.id).then(person => {
        response.json(person)
    })
})



app.post('/api/persons', (request, response) => {
    const body = request.body


    if (!body || !body.name || !body.number) {
        return response.status(400).json({ 
            error: 'name/number missing' 
        })
    }

    // if (alreadyPresent(body.name, persons)){
    //     return response.status(400).json({
    //         error: `${body.name} already present`
    //     })
    // }
    const person = new Person({
        name: body.name,
        number: body.number
        // id: generateId(),
    })

    person.save().then(savedPerson => {
        response.json(savedPerson)
    })

})



const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})  