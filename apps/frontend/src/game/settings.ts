import { computed, watch } from 'vue'
import { useLocalStorage, useMediaQuery } from '@vueuse/core'
import type { ComputedRef, Ref } from 'vue'

import { storageKeys } from '@/shared/storage'

export type DockSide = 'bottom' | 'left' | 'right'
export type ThemeName = 'light' | 'dark'

export const ELEMENT_SIZE_OPTIONS = [
  { id: 30, label: 'Маленький' },
  { id: 38, label: 'Средний' },
  { id: 46, label: 'Большой' },
] as const

export type ElementSize = typeof ELEMENT_SIZE_OPTIONS[number]['id']

export interface GameSettings {
  volume: number
  elementSize: ElementSize
  hideEndedElements: boolean
  dock: DockSide
  theme: ThemeName
}

const DEFAULT_SETTINGS: GameSettings = {
  volume: 10,
  elementSize: 38,
  hideEndedElements: false,
  dock: 'bottom',
  theme: 'dark',
}

function applyTheme(theme: ThemeName | undefined) {
  document.documentElement.dataset.theme = normalizeTheme(theme)
}

function normalizeTheme(theme: string | undefined): ThemeName {
  return theme === 'light'
    ? 'light'
    : 'dark'
}

function snapElementSize(value: number): ElementSize {
  return ELEMENT_SIZE_OPTIONS.reduce((best, option) => {
    return Math.abs(option.id - value) < Math.abs(best - value)
      ? option.id
      : best
  }, DEFAULT_SETTINGS.elementSize)
}

const MOBILE_DOCK_QUERY = '(max-width: 640px)'

export interface SettingsApi {
  values: Ref<GameSettings>
  dock: ComputedRef<DockSide>
  mobile: Ref<boolean>
  reset: () => void
}

export function createSettings(): SettingsApi {
  const values = useLocalStorage<GameSettings>(storageKeys.settings, { ...DEFAULT_SETTINGS }, {
    mergeDefaults: true,
  })

  watch(() => values.value.theme, (theme) => {
    const next = normalizeTheme(theme)
    if (next !== theme) values.value.theme = next
    applyTheme(next)
  }, { immediate: true })
  watch(() => values.value.elementSize, (size) => {
    const next = snapElementSize(size)
    if (next !== size) values.value.elementSize = next
  }, { immediate: true })

  const mobile = useMediaQuery(MOBILE_DOCK_QUERY)
  const dock = computed<DockSide>(() => {
    if (mobile.value) return 'bottom'
    return values.value.dock || 'bottom'
  })

  function reset() {
    values.value = { ...DEFAULT_SETTINGS }
  }

  return {
    values,
    dock,
    mobile,
    reset,
  }
}
