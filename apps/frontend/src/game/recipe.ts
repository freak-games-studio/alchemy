import recipesSource from '@/assets/recipes.json'
import { randomPosition } from './position'
import type { AlchemyElement, AlchemyElementOnBoard, BoardBounds } from './element'

export interface RecipeDefinition {
  id: string
  name: string
  description: string
  recipes: string[][]
  ended?: boolean
}

const recipes = recipesSource as RecipeDefinition[]
const recipesById = new Map<string, RecipeDefinition>()
const recipesByPair = new Map<string, AlchemyElement[]>()

function pairKey(leftId: string, rightId: string): string {
  return leftId < rightId
    ? `${leftId}\0${rightId}`
    : `${rightId}\0${leftId}`
}

for (const element of recipes) {
  recipesById.set(element.id, element)

  for (const pair of element.recipes) {
    const key = pairKey(pair[0], pair[1])
    const result: AlchemyElement = {
      id: element.id,
      name: element.name,
      ended: element.ended ?? false,
    }
    const results = recipesByPair.get(key)
    if (results) {
      results.push(result)
      continue
    }
    recipesByPair.set(key, [result])
  }
}

export function recipeCount(): number {
  return recipes.length
}

export function recipeById(id: string): RecipeDefinition | undefined {
  return recipesById.get(id)
}

export function matchRecipes(leftId: string, rightId: string): AlchemyElement[] {
  return recipesByPair.get(pairKey(leftId, rightId)) ?? []
}

export function createStarters(bounds: BoardBounds, elementSize: number): AlchemyElementOnBoard[] {
  return recipes.slice(0, 4).map((element) => {
    return {
      uuid: crypto.randomUUID(),
      id: element.id,
      name: element.name,
      ended: element.ended ?? false,
      position: randomPosition(bounds, elementSize),
    }
  })
}

export function allElements(): AlchemyElement[] {
  return recipes.map((element) => {
    const item: AlchemyElement = {
      id: element.id,
      name: element.name,
    }

    if (element.ended) item.ended = true
    return item
  })
}
