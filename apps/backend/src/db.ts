import { AsyncAdapter } from '@stenodb/fastify'
import { Type } from 'class-transformer'
import type { AsyncProvider } from '@stenodb/fastify'
import type { FastifyInstance } from 'fastify'

export class AlchemyIngredient {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public recipes: [string, string][] = []
  ) {}
}

export class AlchemyIngredientRepository {
  @Type(() => AlchemyIngredient)
  alchemyIngredients: AlchemyIngredient[]

  constructor(...alchemyIngredients: AlchemyIngredient[]) {
    this.alchemyIngredients = alchemyIngredients
  }
}

export class AlchemyService {
  #alchemyRepository: AsyncProvider<AlchemyIngredientRepository>

  constructor(private readonly fastifyInstance: FastifyInstance) {
    const alchemyRepository =
      this.fastifyInstance.steno.get<AlchemyIngredientRepository>('alchemy')
    if (!alchemyRepository) {
      throw new Error('AlchemyIngredientRepository not found')
    }
    this.#alchemyRepository = alchemyRepository
  }

  findAll() {
    return this.#alchemyRepository.data!.alchemyIngredients
  }

  findById(id: string) {
    return this.findAll()?.find((alchemyIngredient) => {
      return alchemyIngredient.id === id
    })
  }

  checkRecipes(recipes: string[]) {}
}

export const alchemyIngredientAdapter = new AsyncAdapter(
  'alchemy',
  AlchemyIngredientRepository
)
