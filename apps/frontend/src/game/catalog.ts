import { computed } from 'vue'
import { useStorage } from '@vueuse/core'
import type { ComputedRef, Ref } from 'vue'

import { allElements, recipeCount } from './recipe'
import type { AudioApi } from './audio'
import type { AlchemyElement } from './element'

export interface CatalogApi {
  opened: Ref<AlchemyElement[]>
  counter: ComputedRef<string>
  reset: () => void
  isOpen: (elementId: string) => AlchemyElement | undefined
  add: (element: AlchemyElement) => void
  seed: (elements: AlchemyElement[]) => void
  unlockAll: () => void
}

export function createCatalog(audio: AudioApi): CatalogApi {
  const opened = useStorage<AlchemyElement[]>('alchemy-opened-elements', [])
  const counter = computed(() => `${opened.value.length}/${recipeCount()}`)

  function reset() {
    opened.value = []
  }

  function isOpen(elementId: string) {
    return opened.value.find(element => element.id === elementId)
  }

  function add(element: AlchemyElement) {
    const exists = opened.value.some(item => item.id === element.id)
    if (exists) {
      audio.play('create')
      return
    }

    audio.play('create_new')
    opened.value.push({
      id: element.id,
      name: element.name,
      ended: element.ended,
    })
  }

  function seed(elements: AlchemyElement[]) {
    if (opened.value.length > 0) return

    opened.value = elements.map(element => ({
      id: element.id,
      name: element.name,
      ended: element.ended,
    }))
  }

  function unlockAll() {
    opened.value = allElements()
  }

  return {
    opened,
    counter,
    reset,
    isOpen,
    add,
    seed,
    unlockAll,
  }
}
