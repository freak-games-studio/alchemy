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

export function recipeCount(): number {
  return recipes.length
}

export function recipeById(id: string): RecipeDefinition | undefined {
  return recipes.find(recipe => recipe.id === id)
}

export function matchRecipes(leftId: string, rightId: string): AlchemyElement[] {
  const results: AlchemyElement[] = []

  for (const element of recipes) {
    if (!element.recipes.length) continue

    for (const pair of element.recipes) {
      const [first, second] = pair
      const matches = (first === leftId && second === rightId)
        || (first === rightId && second === leftId)
      if (!matches) continue

      results.push({
        id: element.id,
        name: element.name,
        ended: element.ended ?? false,
      })
    }
  }

  return results
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
