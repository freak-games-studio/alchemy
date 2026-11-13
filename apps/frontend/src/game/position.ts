import type { BoardBounds, Position } from './element'

export function randomPosition(bounds: BoardBounds, elementSize: number): Position {
  return {
    x: Math.random() * (bounds.right - bounds.left - elementSize) + bounds.left,
    y: Math.random() * (bounds.bottom - bounds.top - elementSize) + bounds.top,
  }
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
