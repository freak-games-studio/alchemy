import type { ElementBox, Position } from './element'

export function boxesOverlap(a: Position, b: Position, size: ElementBox): boolean {
  return !(
    a.x >= b.x + size.width
    || a.x + size.width <= b.x
    || a.y >= b.y + size.height
    || a.y + size.height <= b.y
  )
}
