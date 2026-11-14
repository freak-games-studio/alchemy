import recipesSource from '@/assets/recipes.json'
import { uniqueId } from './id'
import { randomPosition } from './position'
import type { AlchemyElement, AlchemyElementOnBoard, BoardBounds } from './element'

export type RecipePair = [string, string] | [string, string, true]

export interface RecipeDefinition {
  id: string
  name: string
  description: string
  recipes: RecipePair[]
  category?: string[]
  ended?: boolean
}

export interface RecipeMatch {
  element: AlchemyElement
  propagate: boolean
}

export interface RecipeCategory {
  id: string
  label: string
}

const categoryOrder = [
  'food',
  'fauna',
  'flora',
  'country',
  'traffic',
  'figures',
  'alcohol',
  'people',
  'being',
  'space',
  'buildings',
]

const categoryLabels: Record<string, string> = {
  food: 'Пища',
  fauna: 'Фауна',
  flora: 'Флора',
  country: 'Страны',
  traffic: 'Транспорт',
  figures: 'Личности',
  alcohol: 'Алкоголь',
  people: 'Люди',
  being: 'Существа',
  space: 'Космос',
  buildings: 'Постройки',
}

const recipes = recipesSource as RecipeDefinition[]
const recipesById = new Map<string, RecipeDefinition>()
const recipesByPair = new Map<string, RecipeMatch[]>()

function pairKey(leftId: string, rightId: string): string {
  return leftId < rightId
    ? `${leftId}\0${rightId}`
    : `${rightId}\0${leftId}`
}

for (const element of recipes) {
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

export function recipeCount(): number {
  return recipes.length
}

export function recipeById(id: string): RecipeDefinition | undefined {
  return recipesById.get(id)
}

export function recipeCategories(): RecipeCategory[] {
  const present = new Set<string>()
  for (const element of recipes) {
    element.category?.forEach(name => present.add(name))
  }

  const known = categoryOrder.filter(id => present.has(id))
  const extra = [...present].filter(id => !categoryOrder.includes(id))
  return [
    ...known,
    ...extra,
  ].map(id => ({
    id,
    label: categoryLabels[id] ?? id,
  }))
}

export function matchRecipes(leftId: string, rightId: string): RecipeMatch[] {
  return recipesByPair.get(pairKey(leftId, rightId)) ?? []
}

export function createStarters(bounds: BoardBounds, elementSize: number): AlchemyElementOnBoard[] {
  return recipes.slice(0, 4).map((element) => {
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
  return recipes.map((element) => {
    const item: AlchemyElement = {
      id: element.id,
      name: element.name,
    }

    if (element.ended) item.ended = true
    return item
  })
}
