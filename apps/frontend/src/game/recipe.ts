import { shallowRef } from 'vue'

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
  'easter',
]

export const recipeCategoryOrder: readonly string[] = categoryOrder

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
  easter: 'Пасхалки',
}

export function categoryLabel(id: string): string {
  return categoryLabels[id] ?? id
}

const recipes = shallowRef<RecipeDefinition[]>([])
const recipesById = new Map<string, RecipeDefinition>()
const recipesByPair = new Map<string, RecipeMatch[]>()

export function refreshEnded(list: RecipeDefinition[]) {
  const used = new Set<string>()
  for (const recipe of list) {
    for (const pair of recipe.recipes) {
      used.add(pair[0])
      used.add(pair[1])
    }
  }
  for (const recipe of list) {
    if (used.has(recipe.id)) delete recipe.ended
    else recipe.ended = true
  }
}

function pairKey(leftId: string, rightId: string): string {
  return leftId < rightId
    ? `${leftId}\0${rightId}`
    : `${rightId}\0${leftId}`
}

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
  if (!Array.isArray(data)) throw new TypeError('Рецепты должны быть массивом')
  const list = data as RecipeDefinition[]
  refreshEnded(list)
  indexRecipes(list)
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

export function recipeCategories(): RecipeCategory[] {
  const present = new Set<string>()
  for (const element of recipes.value) {
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
  if (!recipes.value.length) return []
  return recipesByPair.get(pairKey(leftId, rightId)) ?? []
}

export function createStarters(bounds: BoardBounds, elementSize: number): AlchemyElementOnBoard[] {
  return recipes.value.slice(0, 4).map((element) => {
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
