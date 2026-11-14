import type { RecipeDefinition } from '@/game/recipe'

export const ELEMENT_WIDTH = 172
export const ELEMENT_HEIGHT = 86

const COLUMNS = 8
const GAP_X = 28
const GAP_Y = 96
const STARTERS = 4
const INNER_GAP = 10
const PLUS_WIDTH = 28
const PAIR_GAP = 72
const PAIRS_PER_ROW = 3

export interface LayoutNode {
  id: string
  elementId: string
  kind: 'element' | 'plus'
  pairIndex: number | null
  x: number
  y: number
  width: number
  height: number
}

interface PairSlot {
  index: number
  left?: string
  right?: string
}

export function layoutFocus(recipes: RecipeDefinition[], centerId: string | null): LayoutNode[] {
  if (!centerId) return placeRows(recipes.slice(0, STARTERS).map(recipe => recipe.id))
  const known = new Set(recipes.map(recipe => recipe.id))
  const center = recipes.find(recipe => recipe.id === centerId)
  if (!center || !known.has(centerId)) return []

  const above = placePairs(collectPairs(center, known))
  const products: string[] = []
  for (const recipe of recipes) {
    if (recipe.id === centerId) continue
    const usesCenter = recipe.recipes.some(pair => pair[0] === centerId || pair[1] === centerId)
    if (usesCenter) products.push(recipe.id)
  }
  const below = placeRows(products)
  const aboveSize = bounds(above)
  const belowSize = bounds(below)
  const width = Math.max(aboveSize.width, belowSize.width, ELEMENT_WIDTH)
  const centerY = above.length
    ? aboveSize.height + GAP_Y
    : 0
  const nodes = [
    ...above,
    {
      id: centerId,
      elementId: centerId,
      kind: 'element' as const,
      pairIndex: null,
      x: 0,
      y: centerY,
      width: ELEMENT_WIDTH,
      height: ELEMENT_HEIGHT,
    },
    ...below,
  ]
  const centerNode = nodes.find(node => node.id === centerId)
  if (centerNode) centerNode.x = Math.round((width - ELEMENT_WIDTH) / 2)
  shift(above, (width - aboveSize.width) / 2, 0)
  shift(below, (width - belowSize.width) / 2, centerY + ELEMENT_HEIGHT + GAP_Y)
  return nodes
}

function collectPairs(center: RecipeDefinition, known: Set<string>): PairSlot[] {
  const slots: PairSlot[] = []
  for (let index = 0; index < center.recipes.length; index += 1) {
    const pair = center.recipes[index]
    if (!pair) continue
    const left = known.has(pair[0])
      ? pair[0]
      : undefined
    const right = known.has(pair[1])
      ? pair[1]
      : undefined
    if (!left && !right) continue
    slots.push({ index, left, right })
  }
  return slots
}

function placePairs(pairs: PairSlot[]): LayoutNode[] {
  const rows: PairSlot[][] = []
  for (let index = 0; index < pairs.length; index += PAIRS_PER_ROW) rows.push(pairs.slice(index, index + PAIRS_PER_ROW))
  const widths = rows.map(row => pairRowWidth(row))
  const width = Math.max(0, ...widths)
  const nodes: LayoutNode[] = []
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]
    if (!row) continue
    let x = (width - (widths[rowIndex] ?? 0)) / 2
    const y = rowIndex * (ELEMENT_HEIGHT + GAP_Y)
    for (const pair of row) {
      nodes.push(...placePair(pair, x, y))
      x += pairWidth(pair) + PAIR_GAP
    }
  }
  return nodes
}

function placePair(pair: PairSlot, x: number, y: number): LayoutNode[] {
  const nodes: LayoutNode[] = []
  let cursor = x
  if (pair.left) {
    nodes.push(card({
      id: `in:${pair.index}:0`,
      elementId: pair.left,
      pairIndex: pair.index,
      x: cursor,
      y,
    }))
    cursor += ELEMENT_WIDTH + INNER_GAP
  }
  if (pair.left && pair.right) {
    nodes.push({
      id: `plus:${pair.index}`,
      elementId: '',
      kind: 'plus',
      pairIndex: pair.index,
      x: Math.round(cursor),
      y: Math.round(y),
      width: PLUS_WIDTH,
      height: ELEMENT_HEIGHT,
    })
    cursor += PLUS_WIDTH + INNER_GAP
  }
  if (pair.right) {
    nodes.push(card({
      id: `in:${pair.index}:1`,
      elementId: pair.right,
      pairIndex: pair.index,
      x: cursor,
      y,
    }))
  }
  return nodes
}

function card(input: { id: string, elementId: string, pairIndex: number | null, x: number, y: number }): LayoutNode {
  return {
    id: input.id,
    elementId: input.elementId,
    kind: 'element',
    pairIndex: input.pairIndex,
    x: Math.round(input.x),
    y: Math.round(input.y),
    width: ELEMENT_WIDTH,
    height: ELEMENT_HEIGHT,
  }
}

function pairWidth(pair: PairSlot): number {
  if (pair.left && pair.right) return ELEMENT_WIDTH * 2 + INNER_GAP * 2 + PLUS_WIDTH
  return ELEMENT_WIDTH
}

function pairRowWidth(row: PairSlot[]): number {
  if (!row.length) return 0
  const cards = row.reduce((sum, pair) => sum + pairWidth(pair), 0)
  return cards + PAIR_GAP * (row.length - 1)
}

function placeRows(ids: string[]): LayoutNode[] {
  const rows: string[][] = []
  for (let index = 0; index < ids.length; index += COLUMNS) rows.push(ids.slice(index, index + COLUMNS))
  const width = Math.max(0, ...rows.map(rowWidth))
  const nodes: LayoutNode[] = []
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]
    if (!row) continue
    const offset = (width - rowWidth(row)) / 2
    const y = rowIndex * (ELEMENT_HEIGHT + GAP_Y)
    for (const [column, id] of row.entries()) {
      nodes.push(card({
        id,
        elementId: id,
        pairIndex: null,
        x: offset + column * (ELEMENT_WIDTH + GAP_X),
        y,
      }))
    }
  }
  return nodes
}

function rowWidth(row: string[]): number {
  if (!row.length) return 0
  return row.length * ELEMENT_WIDTH + (row.length - 1) * GAP_X
}

function bounds(nodes: LayoutNode[]): { width: number, height: number } {
  let width = 0
  let height = 0
  for (const node of nodes) {
    width = Math.max(width, node.x + node.width)
    height = Math.max(height, node.y + node.height)
  }
  return { width, height }
}

function shift(nodes: LayoutNode[], x: number, y: number) {
  for (const node of nodes) {
    node.x = Math.round(node.x + x)
    node.y = Math.round(node.y + y)
  }
}
