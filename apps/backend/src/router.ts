import crypto from 'node:crypto'
import type { FastifyInstance } from 'fastify'

import type { AlchemyService } from './db.js'

export function alchemyRouter(
  fastify: FastifyInstance,
  alchemyService: AlchemyService
): void {
  fastify.get('/', async (request, reply) => {
    const elements = alchemyService.findAll()
    const basicElements = elements.slice(0, 4).map((element) => {
      return {
        uuid: crypto.randomUUID(),
        id: element.id,
        name: element.name
      }
    })

    reply.send({
      recipes: elements.length,
      basicElements
    })
  })

  fastify.get<{
    Params: {
      id: string
    }
  }>('/:id', async (request, reply) => {
    const item = alchemyService.findById(request.params.id)
    if (!item) {
      reply.status(404)
      reply.send({ error: 'Not found' })
      return
    }
    item.recipes = []
    reply.send(item)
  })

  fastify.post<{
    Body: {
      recipe: [string, string]
    }
  }>(
    '/check-recipe',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            recipe: {
              type: 'array',
              items: {
                type: 'string'
              },
              minItems: 2,
              maxItems: 2
            }
          },
          required: ['recipe']
        }
      }
    },
    async (request, reply) => {
      const elements = alchemyService.findAll()
      const { recipe } = request.body

      for (const element of elements) {
        if (element.recipes.length === 0) continue

        for (const elementRecipe of element.recipes) {
          if (
            (elementRecipe[0] === recipe[0] &&
              elementRecipe[1] === recipe[1]) ||
            (elementRecipe[0] === recipe[1] && elementRecipe[1] === recipe[0])
          ) {
            return reply.send({
              uuid: crypto.randomUUID(),
              id: element.id,
              name: element.name
            })
          }
        }
      }

      reply.status(404)
      reply.send({ error: 'Not found' })
    }
  )
}
