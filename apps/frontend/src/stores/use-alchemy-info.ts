import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useFetch } from '@vueuse/core'
import { useOpenedElements } from './use-opened-elements.js'
import { INNER_HEIGHT, INNER_WIDTH } from '@/constants.js'
import type { AlchemyElement, AlchemyElementOnBoard } from '@/types.js'

interface AlchemyInfo {
  recipes: number
  basicElements: AlchemyElement[]
}

export const useAlchemyInfo = defineStore('alchemy-info', () => {
  const { data } = useFetch(import.meta.env.VITE_BACKEND_URL).json<AlchemyInfo>()
  const openedElements = useOpenedElements()

  const availableRecipes = computed(() => {
    return `${openedElements.openedElements.length} / ${data.value?.recipes ?? 0}`
  })

  const basicElements = computed((): AlchemyElementOnBoard[] | undefined => {
    return data.value?.basicElements.map((element) => {
      return {
        ...element,
        position: {
          x: Math.floor(Math.random() * INNER_WIDTH),
          y: Math.floor(Math.random() * INNER_HEIGHT),
        }
      }
    })
  })

  return {
    availableRecipes,
    basicElements
  }
})
