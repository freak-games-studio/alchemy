import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'

import { pairKey, parseRecipes, refreshEnded, serializeRecipes, STARTER_COUNT } from './recipe'
import type { RecipeDefinition, RecipePair } from './recipe'

const frontendRoot = fileURLToPath(new URL('../..', import.meta.url))

function element(id: string, recipes: RecipePair[] = []): RecipeDefinition {
  return {
    id,
    name: id,
    description: id,
    recipes,
  }
}

function sourceFiles(directory: string): string[] {
  const found: string[] = []
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) {
      found.push(...sourceFiles(path))
      continue
    }
    if (path.endsWith('.test.ts')) continue
    if (path.endsWith('.ts') || path.endsWith('.vue')) found.push(path)
  }
  return found
}

function filesMentioning(token: string): string[] {
  return [
    ...sourceFiles(join(frontendRoot, 'src')),
    ...sourceFiles(join(frontendRoot, 'vite')),
  ].filter(path => readFileSync(path, 'utf8').includes(token))
}

describe('pairKey', () => {
  it('treats ingredient order as the same pair', () => {
    expect(pairKey('water', 'fire')).toBe(pairKey('fire', 'water'))
    expect(pairKey('water', 'fire')).toBe('fire\0water')
    expect(pairKey('water', 'fire')).not.toBe(pairKey('water', 'earth'))
  })
})

describe('parseRecipes', () => {
  it('keeps a propagating pair', () => {
    expect(parseRecipes([
      element('a'),
      element('b'),
      element('c', [
        ['b', 'a', true],
      ]),
    ])).toEqual({
      recipes: [
        element('a'),
        element('b'),
        element('c', [
          ['b', 'a', true],
        ]),
      ],
    })
  })

  it('rejects a repeated id', () => {
    expect(parseRecipes([
      element('a'),
      element('a'),
    ])).toEqual({ error: 'Id «a» повторяется' })
  })

  it('rejects the same pair written in either order', () => {
    expect(parseRecipes([
      element('a'),
      element('b'),
      element('c', [
        ['a', 'b'],
        ['b', 'a'],
      ]),
    ])).toEqual({ error: 'У «c» повторяется пара' })
  })

  it('rejects an unknown ingredient', () => {
    expect(parseRecipes([
      element('c', [
        ['missing', 'c'],
      ]),
    ])).toEqual({ error: 'В рецепте «c» нет элемента missing' })
  })

  it('rejects a payload that is not a list', () => {
    expect(parseRecipes({})).toEqual({ error: 'Рецепты должны быть массивом' })
  })
})

describe('refreshEnded', () => {
  it('marks only elements that are never ingredients', () => {
    const recipes = [
      element('fire', [
        ['stone', 'stone'],
      ]),
      element('stone'),
      element('steam', [
        ['fire', 'water'],
      ]),
      element('water'),
    ]
    const fire = recipes[0]
    if (fire) fire.ended = true
    refreshEnded(recipes)
    expect(recipes.find(item => item.id === 'fire')?.ended).toBeUndefined()
    expect(recipes.find(item => item.id === 'stone')?.ended).toBeUndefined()
    expect(recipes.find(item => item.id === 'water')?.ended).toBeUndefined()
    expect(recipes.find(item => item.id === 'steam')?.ended).toBe(true)
  })
})

describe('serializeRecipes', () => {
  it('drops a stored ended flag that the graph does not confirm', () => {
    const parsed = parseRecipes([
      {
        ...element('a'),
        ended: false,
      },
      element('b', [
        ['a', 'a'],
      ]),
    ])
    expect(parsed).toEqual({
      recipes: [
        element('a'),
        element('b', [
          ['a', 'a'],
        ]),
      ],
    })
    if ('error' in parsed) return
    refreshEnded(parsed.recipes)
    const saved = serializeRecipes(parsed.recipes)
    expect(saved).toEqual({
      body: `${JSON.stringify([
        element('a'),
        {
          ...element('b', [
            ['a', 'a'],
          ]),
          ended: true,
        },
      ], null, 2)}\n`,
    })
  })
})

describe('shipped recipes', () => {
  it('parse and stay valid after ended flags are derived', () => {
    const file = new URL('../../public/recipes.json', import.meta.url)
    const input: unknown = JSON.parse(readFileSync(file, 'utf8'))
    const parsed = parseRecipes(input)
    expect(parsed).not.toHaveProperty('error')
    if ('error' in parsed) return
    expect(parsed.recipes.length).toBeGreaterThanOrEqual(STARTER_COUNT)
    expect(parsed.recipes.slice(0, STARTER_COUNT).map(item => item.id)).toEqual([
      'fire',
      'water',
      'air',
      'ground',
    ])
    refreshEnded(parsed.recipes)
    expect(serializeRecipes(parsed.recipes)).not.toHaveProperty('error')
  })
})

describe('recipe rules stay in one module', () => {
  it('defines pair matching and element ids only in the domain', () => {
    const domain = join(frontendRoot, 'src/domain/recipe.ts')
    expect(filesMentioning('function pairKey')).toEqual([domain])
    expect(filesMentioning('[a-z0-9_]+')).toEqual([domain])
    expect(STARTER_COUNT).toBe(4)
  })
})
