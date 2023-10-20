import { defineStore } from 'pinia'
import * as vueuse from '@vueuse/core'
import { useElements } from './use-elements.js'
import type { BoardElement } from '@/types.js'

export const useBoard = defineStore('board', () => {
  const elements = useElements()
  const board = vueuse.useStorage('board', elements.getInitialElements())

  function $reset(): void {
    board.value = elements.getInitialElements()
  }

  function addElement(element: BoardElement): void {
    board.value.push(element)
  }

  return {
    board,
    $reset,
    addElement
  }
})
