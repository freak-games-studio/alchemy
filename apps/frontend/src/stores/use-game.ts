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

  function activateCheatCode(event: DragEvent) {
    if (!event.dataTransfer) return
    event.preventDefault()

    const elementData = JSON.parse(event.dataTransfer.getData('text/plain')) as {
      element: AlchemyElement
    }
    if (!elementData) return
    if (elementData.element.id !== 'vodka') return

    const isConfirm = confirm('ТЫ ЧЕ ПЬЯНЫЙ!?')
    if (!isConfirm) return

    openedElements.openedElements = recipes.map((element) => {
      const el: AlchemyElement = {
        id: element.id,
        name: element.name,
      }

      if (element.ended) {
        el.ended = true
      }

      return el
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
    activateCheatCode,
    createElement,
    getRandomPosition,
    $reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGame, import.meta.hot))
}
