async function routes (fastify, options) {
  const collection =  fastify.mongo.client.db('TW_2024').collection('users')
  
    fastify.get('/', async (request, reply) => {
      return { hello: 'world' }
    })
  
    fastify.get('/users', async (request, reply) => {
      const result = await collection.find().toArray()
      if (result.length === 0) {
        throw new Error('No documents found')
      }
      return result
    })
  
    fastify.get('/users/:user', async (request, reply) => {
      const result = await collection.findOne({ animal: request.params.animal })
      if (!result) {
        throw new Error('Invalid value')
      }
      return result
    })
  
    const UserSchema = {
      type: 'object',
      additionalProperties:false,
      required: ['username','pswd','nome','cognome'],
      properties: {
        username: {type: 'string'},
        pswd: {type: 'string'},
        nome: { type: 'string' },
        cognome: {type: 'string'},
        perInfo: {type: 'string'},
      },
    }

    const loginschema= {
      type: 'object',
      additionalProperties:false,
      required: ['username','pswd'],
      properties: {
        username: {type:'string'},
        pswd: {type: 'string'},
      }
    }
  
    const schemaReg = {
      body: UserSchema,
    }

    const schemaLogin = {
      body: loginschema,
    }


  
    fastify.post('/users', { schemaReg }, async (request, reply) => {
      // we can use the `request.body` object to get the data sent by the client
      const result = await collection.insertOne({ user: request.body })
      return result
    })

    fastify.post('/users', { schemaLogin }, async (request, reply) => {
      // we can use the `request.body` object to get the data sent by the client
      const result = await collection.insertOne({ user: request.body })
      return result
    })
  }
  
  module.exports = routes