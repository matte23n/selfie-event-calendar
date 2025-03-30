const fastifyPlugin = require('fastify-plugin')

/**
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function dbConnector (fastify, options) {
  fastify.register(require('@fastify/mongodb'), {
    url: 'mongodb+srv://mattia:dbmattiaadmin@calendario.ko8z3.mongodb.net/?retryWrites=true&w=majority&appName=Calendario'
  })
}

module.exports = fastifyPlugin(dbConnector)