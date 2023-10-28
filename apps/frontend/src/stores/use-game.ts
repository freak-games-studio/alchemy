import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useFetch } from '@vueuse/core'
import { useBoard } from './use-board.js'
import { useOpenedElements } from './use-opened-elements.js'
import { API_URL } from '@/constants.js'
import type { AlchemyElement, AlchemyElementOnBoard, Position } from '@/types.js'

interface AlchemyInfo {
  recipes: number
  basicElements: AlchemyElement[]
}

export const useGame = defineStore('game', () => {
  const board = useBoard()
  const { data } = useFetch(`${API_URL}/api/alchemy`).json<AlchemyInfo>()
  const openedElements = useOpenedElements()

  const availableRecipes = computed(() => {
    return `${openedElements.openedElements.length} / ${data.value?.recipes ?? 0}`
  })

  const basicElements = computed((): AlchemyElementOnBoard[] | undefined => {
    return data.value?.basicElements.map((element) => {
      return {
        ...element,
        position: getRandomPosition()
      }
    })
  })

  function getRandomPosition(): Position {
    return {
      x: Math.floor(Math.random() * board.boardPosition.left),
      y: Math.floor(Math.random() * board.boardPosition.top)
    }
  }

  function $reset() {
    const isConfirm = confirm('Are you sure you want to start a new game?')
    if (!isConfirm) return
    board.$reset()
    openedElements.$reset()
  }

  return {
    availableRecipes,
    basicElements,
    getRandomPosition,
    $reset
  }
})
