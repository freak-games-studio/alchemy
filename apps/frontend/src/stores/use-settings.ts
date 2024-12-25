import { useLocalStorage } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'

const DEFAULT_SETTINGS = {
  volume: 20,
  elementSize: 50,
  hideEndedElements: false,
}

export const useSettings = defineStore('settings', () => {
  const settings = useLocalStorage('alchemy-settings', { ...DEFAULT_SETTINGS })

  function $reset() {
    const isConfirm = confirm('Вы точно хотите сбросить настройки?')
    if (!isConfirm) return
    settings.value = { ...DEFAULT_SETTINGS }
  }

  return {
    settings,
    $reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettings, import.meta.hot))
}
