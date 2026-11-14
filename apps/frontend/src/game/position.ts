import type { BoardBounds, ElementBox, Position } from './element'

const CLUSTER_GAP = 12
const CLUSTER_COLS = 2
const GRID_GAP = 16

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

export function gridPositions(
  count: number,
  bounds: BoardBounds,
  cell: ElementBox,
): Position[] {
  const gap = GRID_GAP
  if (count <= 0) return []

  const width = Math.max(1, cell.width)
  const height = Math.max(1, cell.height)
  const innerW = Math.max(0, bounds.right - bounds.left)
  const innerH = Math.max(0, bounds.bottom - bounds.top)
  const maxCols = Math.max(1, Math.floor((innerW + gap) / (width + gap)))
  const maxRows = Math.max(1, Math.floor((innerH + gap) / (height + gap)))

  let cols = Math.min(count, maxCols)
  let rows = Math.ceil(count / cols)
  if (rows > maxRows) {
    cols = Math.min(count, Math.ceil(count / maxRows))
    rows = Math.ceil(count / cols)
  }

  const stepX = cols <= 1
    ? 0
    : Math.min(width + gap, Math.max(0, (innerW - width) / (cols - 1)))
  const stepY = rows <= 1
    ? 0
    : Math.min(height + gap, Math.max(0, (innerH - height) / (rows - 1)))

  return Array.from({ length: count }, (_, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    return {
      x: bounds.left + col * stepX,
      y: bounds.top + row * stepY,
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
