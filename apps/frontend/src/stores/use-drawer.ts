import { ref } from 'vue'
import { defineStore } from 'pinia'
import recipes from '@/assets/recipes.json'
import type { AlchemyElement, AlchemyElementOnBoard } from '@/types'

interface AlchemyRecipe {
  id: string
  name: string
  description: string
  recipes: string[][]
}

export const useDrawer = defineStore("drawer", () => {
  const isOpen = ref(false)
  const openedElement = ref<AlchemyRecipe | null>(null)

  function openDrawer(element: AlchemyElement) {
    isOpen.value = true
    openedElement.value = recipes.find((recipe) => recipe.id === element.id)!
  }

  return {
    isOpen,
    openedElement,
    openDrawer
  }
})
