import type { BoardBounds, Position } from './element'

const CLUSTER_GAP = 12
const CLUSTER_COLS = 2

function clamp(min: number, value: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

export function randomPosition(bounds: BoardBounds, elementSize: number): Position {
  return {
    x: Math.random() * (bounds.right - bounds.left - elementSize) + bounds.left,
    y: Math.random() * (bounds.bottom - bounds.top - elementSize) + bounds.top,
  }
}

export function clusterPositions(center: Position, cell: number, bounds: BoardBounds): Position[] {
  const count = CLUSTER_COLS ** 2
  const gridWidth = CLUSTER_COLS * cell + (CLUSTER_COLS - 1) * CLUSTER_GAP
  const gridHeight = gridWidth
  const originX = clamp(bounds.left, center.x - gridWidth / 2, bounds.right - gridWidth)
  const originY = clamp(bounds.top, center.y - gridHeight / 2, bounds.bottom - gridHeight)

  return Array.from({ length: count }, (_, index) => {
    const col = index % CLUSTER_COLS
    const row = Math.floor(index / CLUSTER_COLS)
    return {
      x: originX + col * (cell + CLUSTER_GAP),
      y: originY + row * (cell + CLUSTER_GAP),
    }
  })
}

export function offsetPosition(position: Position, offset: number): Position {
  if (offset === 0) {
    return {
      x: position.x,
      y: position.y,
    }
  }

  return {
    x: position.x + (30 * offset),
    y: position.y + (30 * offset),
  }
}
