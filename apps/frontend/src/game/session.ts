import { ref } from 'vue'
import type { Ref } from 'vue'

import { recipeById } from './recipe'
import type { CatalogApi } from './catalog'
import type { AlchemyElement } from './element'

export interface AboutIngredient {
  id: string
  name: string
  ended?: boolean
}

export interface AboutElement {
  id: string
  name: string
  description: string
  recipes: AboutIngredient[][]
}

export interface SessionApi {
  guide: {
    isOpen: Ref<boolean>
    toggle: () => void
    close: () => void
  }
  about: {
    isOpen: Ref<boolean>
    activeElement: Ref<AboutElement | null>
    open: (element: AlchemyElement) => void
  }
}

export function createSession(catalog: CatalogApi): SessionApi {
  const guideOpen = ref(false)
  const aboutOpen = ref(false)
  const activeElement = ref<AboutElement | null>(null)

  function toggleGuide() {
    guideOpen.value = !guideOpen.value
  }

  function closeGuide() {
    guideOpen.value = false
  }

  function openAbout(element: AlchemyElement) {
    aboutOpen.value = true

    const recipe = recipeById(element.id)!
    const openedRecipes: AboutIngredient[][] = []

    for (const pair of recipe.recipes) {
      const [leftId, rightId] = pair
      const left = catalog.isOpen(leftId)
      const right = catalog.isOpen(rightId)
      if (left && right) openedRecipes.push([left, right])
    }

    activeElement.value = {
      id: element.id,
      name: element.name,
      description: recipe.description,
      recipes: openedRecipes,
    }
  }

  return {
    guide: {
      isOpen: guideOpen,
      toggle: toggleGuide,
      close: closeGuide,
    },
    about: {
      isOpen: aboutOpen,
      activeElement,
      open: openAbout,
    },
  }
}
