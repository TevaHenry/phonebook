const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')

morgan.token('body', function (req, res) { return JSON.stringify(req.body)})

app.use(bodyParser.json())
app.use(cors())
app.use(morgan(function (tokens, req, res) {
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms',
    tokens.body(req, res)
  ].join(' ')
}))
app.use(express.static('build'))


let persons = [
  {
    "name": "Arto Hellas",
    "number": "040-123456",
    "id": 1
  },
  {
    "name": "Ada Lovelace",
    "number": "39-44-5323523",
    "id": 2
  }
]

const generateId = () => Math.floor(Math.random() * 100200)

app.get('/info', (req, res) => {
  const info = `
    <p>Phonebook has info for ${persons.length} people</p>
    <p>${new Date()}</p>
  `
  res.send(info)
})

app.get('/api/persons', (req, res) => {
  res.json(persons)
})

app.get('/api/persons/:id', (req, res) => {
  const id = Number(req.params.id)
  const contact = persons.find(person => person.id === id)
  console.log(contact)

  if (contact) {
    res.json(contact)
  } else {
    res.status(404).end()
  }
})

app.delete('/api/persons/:id', (req, res) => {
  const id = Number(req.params.id)
  persons = persons.filter(person => person.id !== id)

  res.status(204).end()
})

app.post('/api/persons', (req, res) => {
  const body = req.body

  if (persons.some(person => person.name === body.name)) {
    return res.status(400).json({ 
      error: 'name must be unique' 
    })
  } else if (!body.name) {
    return res.status(400).json({ 
      error: 'name missing' 
    })
  } else if((!body.number)) {
    return res.status(400).json({ 
      error: 'number missing' 
    })
  }

  const contact = {...body, id: generateId()}

  persons = persons.concat(contact)

  res.json(contact)
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})