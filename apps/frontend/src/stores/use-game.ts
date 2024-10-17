import { onWatcherCleanup, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useBoard } from './use-board.js'
import { useOpenedElements } from './use-opened-elements.js'
import recipes from '@/assets/recipes.json'
import type { AlchemyElementOnBoard, Position } from '@/types.js'

export const useGame = defineStore('game', () => {
  const board = useBoard()
  const openedElements = useOpenedElements()
  const basicElements = ref<AlchemyElementOnBoard[]>([])

  function getRandomPosition(): Position {
    return {
      x: Math.floor(Math.random() * (board.boardSize.right - board.boardSize.left) + board.boardSize.left),
      y: Math.floor(Math.random() * (board.boardSize.bottom - board.boardSize.top) + board.boardSize.top)
    }
  }

  function $reset() {
    const isConfirm = confirm('Вы точно хотите начать новую игру?')
    if (!isConfirm) return
    board.$reset()
    openedElements.$reset()
  }

  watch(() => board.boardSize, (board) => {
    if (board.bottom === 0) return;
    basicElements.value = recipes.slice(0, 4).map((element) => {
      return {
        uuid: crypto.randomUUID(),
        id: element.id,
        name: element.name,
        ended: element.ended ?? false,
        position: getRandomPosition()
      }
    })
  })

  return {
    basicElements,
    getRandomPosition,
    $reset
  }
})
