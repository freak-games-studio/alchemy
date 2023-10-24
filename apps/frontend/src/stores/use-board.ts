import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import * as vueuse from '@vueuse/core'
import { useGame } from './use-game.js'
import type { AlchemyElementOnBoard } from '@/types.js'
import { useWindowSize } from '@vueuse/core'

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
    width: 60,
    height: 40
  })

  const game = useGame()
  const board = vueuse.useStorage<AlchemyElementOnBoard[]>('alchemy-board', [])

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
