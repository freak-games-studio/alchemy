import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import * as vueuse from '@vueuse/core'
import { useGame } from './use-game.js'
import { useWindowSize } from '@vueuse/core'
import type { AlchemyElementOnBoard } from '@/types.js'

const threshold = 120

export const useBoard = defineStore('board', () => {
  const { width, height } = useWindowSize()

  const boardSize = computed(() => {
    return {
      width: width.value - threshold,
      height: height.value - threshold
    }
  })

  const elementSize = ref({
    width: 50,
    height: 50
  })

  const game = useGame()
  const board = vueuse.useStorage<AlchemyElementOnBoard[]>('alchemy-board-v2', [])

  function $reset(): void {
    board.value = game.basicElements?.map((element) => {
      return {
        ...element,
        position: game.getRandomPosition()
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
    board,
    boardSize,
    elementSize,
    $reset,
    addElement,
  }
})
