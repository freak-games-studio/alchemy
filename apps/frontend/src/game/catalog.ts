import { computed } from 'vue'
import { useStorage } from '@vueuse/core'
import type { ComputedRef, Ref } from 'vue'

import { storageKeys } from '@/shared/storage'
import { allElements, recipeCount } from './recipe'
import type { AudioApi } from './audio'
import type { AlchemyElement } from './element'

export interface CatalogApi {
  opened: Ref<AlchemyElement[]>
  counter: ComputedRef<string>
  reset: () => void
  findOpened: (elementId: string) => AlchemyElement | undefined
  add: (element: AlchemyElement) => boolean
  seed: (elements: AlchemyElement[]) => void
  unlockAll: () => void
}

export function createCatalog(audio: AudioApi): CatalogApi {
  const opened = useStorage<AlchemyElement[]>(storageKeys.opened, [])
  const counter = computed(() => `${opened.value.length}/${recipeCount()}`)

  function reset() {
    opened.value = []
  }

  function findOpened(elementId: string) {
    return opened.value.find(element => element.id === elementId)
  }

  function add(element: AlchemyElement) {
    const exists = opened.value.some(item => item.id === element.id)
    if (exists) {
      audio.play('create')
      return false
    }

    audio.play('create_new')
    opened.value.push({
      id: element.id,
      name: element.name,
      ended: element.ended,
    })
    return true
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
    findOpened,
    add,
    seed,
    unlockAll,
  }
}
