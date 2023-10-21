import { INNER_HEIGHT, INNER_WIDTH } from './constants.js'
import type { Position } from './types.js'

export function getRandomPosition() {
  const position: Position = {
    x: Math.floor(Math.random() * INNER_WIDTH),
    y: Math.floor(Math.random() * INNER_HEIGHT)
  }

  return position
}
