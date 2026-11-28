export type RecipePair = [string, string] | [string, string, true]

export interface RecipeDefinition {
  id: string
  name: string
  description: string
  recipes: RecipePair[]
  category?: string[]
  ended?: boolean
}

export interface RecipeCategory {
  id: string
  label: string
}

export const elementIdBody = '[a-z0-9_]+'
export const elementIdPattern = new RegExp(`^${elementIdBody}$`)
export const STARTER_COUNT = 4

export const recipeCategoryOrder: readonly string[] = [
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

export function pairKey(leftId: string, rightId: string): string {
  return leftId < rightId
    ? `${leftId}\0${rightId}`
    : `${rightId}\0${leftId}`
}

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

function fail(error: string): { error: string } {
  return { error }
}

function parseElement(input: unknown, ids: Set<string>): { recipe: RecipeDefinition } | { error: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return fail('Элемент должен быть объектом')
  const record = input as Record<string, unknown>
  if (typeof record.id !== 'string' || !elementIdPattern.test(record.id)) return fail('Id может содержать только a-z, 0-9 и _')
  if (ids.has(record.id)) return fail(`Id «${record.id}» повторяется`)
  if (typeof record.name !== 'string' || !record.name) return fail(`У «${record.id}» нет имени`)
  if (typeof record.description !== 'string') return fail(`У «${record.name}» нет описания`)
  if (!Array.isArray(record.recipes)) return fail(`У «${record.name}» рецепты должны быть массивом`)

  const recipe: RecipeDefinition = {
    id: record.id,
    name: record.name,
    description: record.description,
    recipes: [],
  }

  if (record.category !== undefined) {
    if (!Array.isArray(record.category) || !record.category.length) return fail(`У «${record.name}» пустые категории`)
    const categories: string[] = []
    for (const category of record.category) {
      if (typeof category !== 'string' || !elementIdPattern.test(category)) return fail(`У «${record.name}» некорректная категория`)
      categories.push(category)
    }
    recipe.category = categories
  }

  if (record.ended !== undefined) {
    if (typeof record.ended !== 'boolean') return fail(`У «${record.name}» некорректный флаг конечного элемента`)
    if (record.ended) recipe.ended = true
  }

  for (const pair of record.recipes) {
    const parsed = parsePair(pair, recipe.name)
    if ('error' in parsed) return parsed
    recipe.recipes.push(parsed.pair)
  }

  return { recipe }
}

function parsePair(input: unknown, name: string): { pair: RecipePair } | { error: string } {
  if (!Array.isArray(input) || (input.length !== 2 && input.length !== 3)) return fail(`У «${name}» пара должна быть из двух элементов`)
  const left = input[0]
  const right = input[1]
  if (typeof left !== 'string' || !elementIdPattern.test(left)) return fail(`У «${name}» некорректный ингредиент`)
  if (typeof right !== 'string' || !elementIdPattern.test(right)) return fail(`У «${name}» некорректный ингредиент`)
  if (input.length === 2) {
    return {
      pair: [left, right],
    }
  }
  if (input[2] !== true) return fail(`У «${name}» третий флаг пары должен быть true`)
  return {
    pair: [left, right, true],
  }
}

function validatePairs(recipe: RecipeDefinition, ids: Set<string>): string | null {
  const seen = new Set<string>()
  for (const pair of recipe.recipes) {
    if (!ids.has(pair[0])) return `В рецепте «${recipe.name}» нет элемента ${pair[0]}`
    if (!ids.has(pair[1])) return `В рецепте «${recipe.name}» нет элемента ${pair[1]}`
    const key = pairKey(pair[0], pair[1])
    if (seen.has(key)) return `У «${recipe.name}» повторяется пара`
    seen.add(key)
  }
  return null
}

export function parseRecipes(input: unknown): { recipes: RecipeDefinition[] } | { error: string } {
  if (!Array.isArray(input)) return fail('Рецепты должны быть массивом')
  const recipes: RecipeDefinition[] = []
  const ids = new Set<string>()
  for (const item of input) {
    const parsed = parseElement(item, ids)
    if ('error' in parsed) return parsed
    ids.add(parsed.recipe.id)
    recipes.push(parsed.recipe)
  }
  for (const recipe of recipes) {
    const error = validatePairs(recipe, ids)
    if (error) return fail(error)
  }
  return { recipes }
}

export function serializeRecipes(input: unknown): { body: string } | { error: string } {
  const parsed = parseRecipes(input)
  if ('error' in parsed) return parsed
  return { body: `${JSON.stringify(parsed.recipes, null, 2)}\n` }
}
