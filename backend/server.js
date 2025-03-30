
const fastify =require("fastify")({
    logger:true
})
fastify.register(require('./our-db-connector'))
fastify.register(require('./our-first-route'))

fastify.listen( { port: 3000 }, function (err, address) {
    if(err){
        fastify.log.error(err)
        ProcessingInstruction.exit(1)
    }
})