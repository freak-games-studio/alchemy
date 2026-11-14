const idPattern = /^[a-z0-9_]+$/

interface RecipeRecord {
  id: string
  name: string
  description: string
  recipes: RecipeTuple[]
  category?: string[]
  ended?: true
}

type RecipeTuple = [string, string] | [string, string, true]

function pairKey(left: string, right: string): string {
  return left < right
    ? `${left}\0${right}`
    : `${right}\0${left}`
}

function fail(error: string): { error: string } {
  return { error }
}

function parseElement(input: unknown, ids: Set<string>): { recipe: RecipeRecord } | { error: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return fail('Элемент должен быть объектом')
  const record = input as Record<string, unknown>
  if (typeof record.id !== 'string' || !idPattern.test(record.id)) return fail('Id может содержать только a-z, 0-9 и _')
  if (ids.has(record.id)) return fail(`Id «${record.id}» повторяется`)
  if (typeof record.name !== 'string' || !record.name) return fail(`У «${record.id}» нет имени`)
  if (typeof record.description !== 'string') return fail(`У «${record.name}» нет описания`)
  if (!Array.isArray(record.recipes)) return fail(`У «${record.name}» рецепты должны быть массивом`)

  const recipe: RecipeRecord = {
    id: record.id,
    name: record.name,
    description: record.description,
    recipes: [],
  }

  if (record.category !== undefined) {
    if (!Array.isArray(record.category) || !record.category.length) return fail(`У «${record.name}» пустые категории`)
    const categories: string[] = []
    for (const category of record.category) {
      if (typeof category !== 'string' || !idPattern.test(category)) return fail(`У «${record.name}» некорректная категория`)
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

function parsePair(input: unknown, name: string): { pair: RecipeTuple } | { error: string } {
  if (!Array.isArray(input) || (input.length !== 2 && input.length !== 3)) return fail(`У «${name}» пара должна быть из двух элементов`)
  const left = input[0]
  const right = input[1]
  if (typeof left !== 'string' || !idPattern.test(left)) return fail(`У «${name}» некорректный ингредиент`)
  if (typeof right !== 'string' || !idPattern.test(right)) return fail(`У «${name}» некорректный ингредиент`)
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

function validatePairs(recipe: RecipeRecord, ids: Set<string>): string | null {
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

export function parseRecipes(input: unknown): { recipes: RecipeRecord[] } | { error: string } {
  if (!Array.isArray(input)) return fail('Рецепты должны быть массивом')
  const recipes: RecipeRecord[] = []
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

export function validateRecipes(input: unknown): string | null {
  const parsed = parseRecipes(input)
  if ('error' in parsed) return parsed.error
  return null
}

export function serializeRecipes(input: unknown): { body: string } | { error: string } {
  const parsed = parseRecipes(input)
  if ('error' in parsed) return parsed
  return { body: `${JSON.stringify(parsed.recipes, null, 2)}\n` }
}
