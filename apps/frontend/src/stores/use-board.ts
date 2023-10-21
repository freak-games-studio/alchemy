import { defineStore } from 'pinia'
import * as vueuse from '@vueuse/core'
import { useAlchemyInfo } from './use-alchemy-info.js'
import type { AlchemyElementOnBoard } from '@/types.js'
import { watch } from 'vue'
import { INNER_HEIGHT, INNER_WIDTH } from '@/constants.js'

export const useBoard = defineStore('board', () => {
  const alchemyInfo = useAlchemyInfo()
  const board = vueuse.useStorage<AlchemyElementOnBoard[]>('alchemy-board', [])

  function $reset(): void {
    board.value = alchemyInfo.basicElements?.map((element) => {
      return {
        ...element,
        position: {
          x: Math.floor(Math.random() * INNER_WIDTH),
          y: Math.floor(Math.random() * INNER_HEIGHT),
        }
      }
    })
  }

  function addElement(element: AlchemyElementOnBoard): void {
    board.value.push(element)
  }

  watch(() => alchemyInfo.basicElements, () => {
    if (board.value.length === 0) {
      board.value = alchemyInfo.basicElements
    }
  })

  return {
    board,
    $reset,
    addElement
  }
})
