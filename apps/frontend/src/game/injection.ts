import { inject } from 'vue'
import type { InjectionKey } from 'vue'

import type { Game } from './create-game'

export const gameKey: InjectionKey<Game> = Symbol('game')

export function useGame(): Game {
  const game = inject(gameKey)
  if (!game) throw new Error('Game context is missing')
  return game
}
