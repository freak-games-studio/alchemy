import { defineStore } from 'pinia'
import * as vueuse from '@vueuse/core'
import { useAlchemyInfo } from './use-alchemy-info.js'
import { watch } from 'vue'
import type { AlchemyElement } from '@/types.js'

export const useOpenedElements = defineStore('opened-elements', () => {
  const alchemyInfo = useAlchemyInfo()
  const openedElements = vueuse.useStorage<Omit<AlchemyElement, 'uuid'>[]>(
    'opened-elements', []
  )

  function $reset(): void {
    openedElements.value = []
  }

  function addRecipe(element: AlchemyElement): void {
    const isExist = openedElements.value.some((e) => e.id === element.id)
    if (isExist) return
    openedElements.value.push({ id: element.id, name: element.name })
  }

  watch(() => alchemyInfo.basicElements, () => {
    if (!alchemyInfo.basicElements || alchemyInfo.basicElements.length > 0) return
    openedElements.value = alchemyInfo.basicElements.map((element) => {
      return {
        id: element.id,
        name: element.name
      }
    })
  })

  return {
    openedElements,
    $reset,
    addRecipe,
  }
})
