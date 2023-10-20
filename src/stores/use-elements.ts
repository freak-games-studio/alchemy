import { ref } from 'vue'
import { defineStore } from 'pinia'
import { innerHeight, innerWidth } from '@/constants.js'
import elementsData from '@/assets/elements.json'
import type { BoardElement } from '@/types.js'

export const useElements = defineStore('elements', () => {
  const elements = ref(elementsData.map((element) => {
    return {
      ...element,
      id: crypto.randomUUID(),
    }
  }) as BoardElement[])

  function getInitialElements(): BoardElement[] {
    return elements.value.slice(0, 4).map((element) => {
      return {
        ...element,
        id: crypto.randomUUID(),
        position: {
          x: Math.floor(Math.random() * innerWidth),
          y: Math.floor(Math.random() * innerHeight),
        },
      }
    })
  }

  return {
    elements,
    getInitialElements,
  }
})
