import 'reflect-metadata'

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import fastifyCors from '@fastify/cors'
import { FastifySteno } from '@stenodb/fastify'
import fastify from 'fastify'

import {
  AlchemyIngredient,
  alchemyIngredientAdapter,
  AlchemyService
} from './db.js'
import { alchemyRouter } from './router.js'

const app = fastify()

app.register(fastifyCors)

app.register(FastifySteno, {
  path: resolve(dirname(fileURLToPath(import.meta.url)), '..', 'db'),
  entities: [AlchemyIngredient],
  adapters: [alchemyIngredientAdapter]
})

app.register((instance, _, done) => {
  const alchemyService = new AlchemyService(app)

  instance.register(
    (instance, _, done) => {
      alchemyRouter(instance, alchemyService)
      done()
    },
    { prefix: '/alchemy' }
  )

  done()
})

app.listen({ host: '0.0.0.0', port: 3000 }, (error) => {
  if (error) {
    console.error(error)
    process.exit(1)
  }

  console.log('Listening on http://localhost:3000')
})
