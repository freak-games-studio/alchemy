import { useLocalStorage } from '@vueuse/core'
import type { Ref } from 'vue'

export interface GameSettings {
  volume: number
  elementSize: number
  hideEndedElements: boolean
}

const DEFAULT_SETTINGS: GameSettings = {
  volume: 20,
  elementSize: 50,
  hideEndedElements: false,
}

export interface SettingsApi {
  values: Ref<GameSettings>
  reset: () => void
}

export function createSettings(): SettingsApi {
  const values = useLocalStorage<GameSettings>('alchemy-settings', { ...DEFAULT_SETTINGS })

  function reset() {
    // eslint-disable-next-line no-alert
    const isConfirm = confirm('Вы точно хотите сбросить настройки?')
    if (!isConfirm) return
    values.value = { ...DEFAULT_SETTINGS }
  }

  return {
    values,
    reset,
  }
}
