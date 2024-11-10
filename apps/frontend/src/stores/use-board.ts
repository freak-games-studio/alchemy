import * as vueuse from '@vueuse/core'
import { useElementBounding } from '@vueuse/core'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useGame } from './use-game.js'
import { useSettings } from './use-settings.js'
import type { AlchemyElementOnBoard } from '@/types.js'

export const useBoard = defineStore('board', () => {
  const { settings } = storeToRefs(useSettings())
  const boardRef = ref<HTMLDivElement>()
  const boardBounding = useElementBounding(boardRef)
  const boardSize = computed(() => {
    return {
      bottom: boardBounding.bottom.value ?? 0,
      left: boardBounding.left.value ?? 0,
      right: boardBounding.right.value ?? 0,
      top: boardBounding.top.value ?? 0,
    }
  })

  const elementSize = computed(() => {
    return {
      width: settings.value.elementSize,
      height: settings.value.elementSize,
      fontSize: `${settings.value.elementSize / 2.5}px`,
    }
  })

  const game = useGame()
  const board = vueuse.useStorage<AlchemyElementOnBoard[]>('alchemy-board', [])

  function $reset(): void {
    board.value = game.basicElements?.map((element) => {
      return {
        ...element,
        position: game.getRandomPosition(),
      }
    })
  }

  function addElement(element: AlchemyElementOnBoard): void {
    board.value.push(element)
  }

  watch(() => game.basicElements, () => {
    if (board.value.length === 0) {
      board.value = game.basicElements
    }
  })

  return {
    boardRef,
    board,
    boardSize,
    elementSize,
    $reset,
    addElement,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useBoard, import.meta.hot))
}
