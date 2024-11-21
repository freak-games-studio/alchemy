import recipes from '@/assets/recipes.json'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { useBoard } from './use-board.js'
import { useOpenedElements } from './use-opened-elements.js'
import { useSettings } from './use-settings.js'
import type { AlchemyElement, AlchemyElementOnBoard, Position } from '@/types.js'

export const useGame = defineStore('game', () => {
  const board = useBoard()
  const openedElements = useOpenedElements()
  const basicElements = ref<AlchemyElementOnBoard[]>([])
  const { settings } = storeToRefs(useSettings())

  function getRandomPosition(): Position {
    const x = Math.random() * (board.boardSize.right - board.boardSize.left - settings.value.elementSize) + board.boardSize.left
    const y = Math.random() * (board.boardSize.bottom - board.boardSize.top - settings.value.elementSize) + board.boardSize.top
    return {
      x,
      y,
    }
  }

  function createElement(element: AlchemyElement, position = getRandomPosition()) {
    board.board.push({
      ...element,
      uuid: crypto.randomUUID(),
      position,
    })
  }

  function $reset() {
    const isConfirm = confirm('Вы точно хотите начать новую игру?')
    if (!isConfirm) return
    board.$reset()
    openedElements.$reset()
  }

  watch(() => board.boardSize, (board) => {
    if (board.bottom === 0) return
    basicElements.value = recipes.slice(0, 4).map((element) => {
      return {
        uuid: crypto.randomUUID(),
        id: element.id,
        name: element.name,
        ended: element.ended ?? false,
        position: getRandomPosition(),
      }
    })
  })

  return {
    basicElements,
    createElement,
    getRandomPosition,
    $reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGame, import.meta.hot))
}
