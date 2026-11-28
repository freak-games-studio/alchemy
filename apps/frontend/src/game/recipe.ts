import { shallowRef } from 'vue'

import {
  categoryLabel,
  pairKey,
  parseRecipes,
  recipeCategoryOrder,
  refreshEnded,
  STARTER_COUNT,
} from '@/domain/recipe'
import { uniqueId } from './id'
import { randomPosition } from './position'
import type { RecipeDefinition } from '@/domain/recipe'
import type { AlchemyElement, AlchemyElementOnBoard, BoardBounds } from './element'

export interface RecipeMatch {
  element: AlchemyElement
  propagate: boolean
}

const recipes = shallowRef<RecipeDefinition[]>([])
const recipesById = new Map<string, RecipeDefinition>()
const recipesByPair = new Map<string, RecipeMatch[]>()

function indexRecipes(list: RecipeDefinition[]) {
  recipesById.clear()
  recipesByPair.clear()
  for (const element of list) {
    recipesById.set(element.id, element)

    for (const pair of element.recipes) {
      const key = pairKey(pair[0], pair[1])
      const match: RecipeMatch = {
        element: {
          id: element.id,
          name: element.name,
          ended: element.ended ?? false,
        },
        propagate: pair.length === 3 && pair[2] === true,
      }
      const results = recipesByPair.get(key)
      if (results) {
        results.push(match)
        continue
      }
      recipesByPair.set(key, [match])
    }
  }
  recipes.value = list
}

export async function loadRecipes() {
  const response = await fetch(`${import.meta.env.BASE_URL}recipes.json`, {
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('Не удалось загрузить рецепты')
  const data: unknown = await response.json()
  const parsed = parseRecipes(data)
  if ('error' in parsed) throw new Error(parsed.error)
  refreshEnded(parsed.recipes)
  indexRecipes(parsed.recipes)
}

export function recipeSource(): RecipeDefinition[] {
  return recipes.value
}

export function recipeCount(): number {
  return recipes.value.length
}

export function recipeById(id: string): RecipeDefinition | undefined {
  if (!recipes.value.length) return undefined
  return recipesById.get(id)
}

export function recipeCategories() {
  const present = new Set<string>()
  for (const element of recipes.value) {
    element.category?.forEach(name => present.add(name))
  }

  const known = recipeCategoryOrder.filter(id => present.has(id))
  const extra = [...present].filter(id => !recipeCategoryOrder.includes(id))
  return [
    ...known,
    ...extra,
  ].map(id => ({
    id,
    label: categoryLabel(id),
  }))
}

export function matchRecipes(leftId: string, rightId: string): RecipeMatch[] {
  if (!recipes.value.length) return []
  return recipesByPair.get(pairKey(leftId, rightId)) ?? []
}

export function createStarters(bounds: BoardBounds, elementSize: number): AlchemyElementOnBoard[] {
  return recipes.value.slice(0, STARTER_COUNT).map((element) => {
    return {
      uuid: uniqueId(),
      id: element.id,
      name: element.name,
      ended: element.ended ?? false,
      position: randomPosition(bounds, elementSize),
    }
  })
}

export function allElements(): AlchemyElement[] {
  return recipes.value.map((element) => {
    const item: AlchemyElement = {
      id: element.id,
      name: element.name,
    }

    if (element.ended) item.ended = true
    return item
  })
}
