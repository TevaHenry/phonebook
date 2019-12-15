require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')

const Contact = require('./models/contact')

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

app.get('/info', (req, res) => {
  Contact.find({}).then(contacts => {
    const info = `
      <p>Phonebook has info for ${contacts.length} people</p>
      <p>${new Date()}</p>
    `
    res.send(info)
  })
})

app.get('/api/persons', (req, res) => {
  Contact.find({}).then(contacts => {
    res.json(contacts)
  })
})

app.get('/api/persons/:id', (req, res, next) => {
  Contact.findById(req.params.id)
    .then(contact => {
      if (contact) {
        res.json(contact.toJSON())
      } else {
        res.status(404).end() 
      }
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
  Contact.findByIdAndRemove(req.params.id)
    .then(result => { 
      res.status(204).end()
    })
    .catch(error => next(error))
})

app.post('/api/persons', (req, res, next) => {
  const body = req.body
    
  const contact = new Contact({
    name: body.name,
    number: body.number,
  })

  contact.save()
    .then(savedContact => savedContact.toJSON())
    .then(savedAndFormattedContact => res.json(savedAndFormattedContact))
    .catch(error => next(error))

  // if (persons.some(person => person.name === body.name)) {
  //   return res.status(400).json({ 
  //     error: 'name must be unique' 
  //   })
  // } else if (!body.name) {
  //   return res.status(400).json({ 
  //     error: 'name missing' 
  //   })
  // } else if((!body.number)) {
  //   return res.status(400).json({ 
  //     error: 'number missing' 
  //   })
})

app.put('/api/persons/:id', (req, res, next) => {
  const contact = { number: req.body.number }

  Contact.findByIdAndUpdate(req.params.id, contact, { new: true })
    .then(updatedContact => res.json(updatedContact.toJSON()))
    .catch(error => next(error))
})

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, req, res, next) => {
  console.error(error.name, error.kind)

  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return res.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})