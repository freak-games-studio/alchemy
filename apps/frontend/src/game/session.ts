import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'

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

export type ShellPanel = 'elements' | 'guide' | 'settings'

export interface SessionApi {
  shell: {
    active: Ref<ShellPanel | null>
    elementsMinimized: Ref<boolean>
    toggle: (panel: ShellPanel) => void
    close: () => void
    minimizeElements: () => void
    restoreElements: () => void
  }
  about: {
    stack: Ref<AboutElement[]>
    current: ComputedRef<AboutElement | null>
    isOpen: ComputedRef<boolean>
    open: (element: AlchemyElement) => void
    back: () => void
    clear: () => void
  }
  confirm: {
    isOpen: Ref<boolean>
    message: Ref<string>
    ask: (message: string) => Promise<boolean>
    accept: () => void
    dismiss: () => void
  }
}

export function createSession(catalog: CatalogApi): SessionApi {
  const active = ref<ShellPanel | null>(null)
  const elementsMinimized = ref(false)
  const aboutStack = ref<AboutElement[]>([])
  const currentElement = computed(() => {
    const stack = aboutStack.value
    return stack[stack.length - 1] ?? null
  })
  const aboutOpen = computed(() => aboutStack.value.length > 0)
  const confirmOpen = ref(false)
  const confirmMessage = ref('')
  let resolveConfirm: ((accepted: boolean) => void) | null = null

  function finishConfirm(accepted: boolean) {
    confirmOpen.value = false
    const resolve = resolveConfirm
    resolveConfirm = null
    resolve?.(accepted)
  }

  function askConfirm(message: string) {
    if (resolveConfirm) finishConfirm(false)
    confirmMessage.value = message
    confirmOpen.value = true
    return new Promise<boolean>((resolve) => {
      resolveConfirm = resolve
    })
  }

  function clearAbout() {
    aboutStack.value = []
  }

  function backAbout() {
    aboutStack.value = aboutStack.value.slice(0, -1)
  }

  function toggle(panel: ShellPanel) {
    elementsMinimized.value = false
    const next = active.value === panel
      ? null
      : panel
    if (active.value === 'elements' && next !== 'elements') clearAbout()
    active.value = next
  }

  function close() {
    if (active.value === 'elements') clearAbout()
    active.value = null
    elementsMinimized.value = false
  }

  function minimizeElements() {
    if (active.value !== 'elements') return
    elementsMinimized.value = true
  }

  function restoreElements() {
    elementsMinimized.value = false
  }

  function onEscape(event: KeyboardEvent) {
    if (event.key !== 'Escape' || confirmOpen.value) return
    if (document.querySelector('[data-context-menu]')) return
    if (aboutStack.value.length) {
      event.stopImmediatePropagation()
      backAbout()
      return
    }
    if (!active.value) return
    event.stopImmediatePropagation()
    close()
  }

  onMounted(() => window.addEventListener('keydown', onEscape, true))
  onUnmounted(() => window.removeEventListener('keydown', onEscape, true))

  function openAbout(element: AlchemyElement) {
    const stack = aboutStack.value
    if (stack[stack.length - 1]?.id === element.id) return

    const recipe = recipeById(element.id)!
    const openedRecipes: AboutIngredient[][] = []

    for (const pair of recipe.recipes) {
      const [leftId, rightId] = pair
      const left = catalog.findOpened(leftId)
      const right = catalog.findOpened(rightId)
      if (left && right) openedRecipes.push([left, right])
    }

    aboutStack.value = [
      ...stack,
      {
        id: element.id,
        name: element.name,
        description: recipe.description,
        recipes: openedRecipes,
      },
    ]
  }

  return {
    shell: {
      active,
      elementsMinimized,
      toggle,
      close,
      minimizeElements,
      restoreElements,
    },
    about: {
      stack: aboutStack,
      current: currentElement,
      isOpen: aboutOpen,
      open: openAbout,
      back: backAbout,
      clear: clearAbout,
    },
    confirm: {
      isOpen: confirmOpen,
      message: confirmMessage,
      ask: askConfirm,
      accept: () => finishConfirm(true),
      dismiss: () => finishConfirm(false),
    },
  }
}
