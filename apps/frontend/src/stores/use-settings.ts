import { useLocalStorage } from '@vueuse/core'
import { acceptHMRUpdate, defineStore } from 'pinia'

export const useSettings = defineStore('settings', () => {
  const settings = useLocalStorage('alchemy-settings', {
    volume: 30,
    elementSize: 50,
    hideEndedElements: false,
  })

  return {
    settings,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSettings, import.meta.hot))
}
