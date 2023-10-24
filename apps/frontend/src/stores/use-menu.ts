import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useMenu = defineStore('menu', () => {
  const isOpened = ref(false)

  function toggle(): void {
    isOpened.value = !isOpened.value
  }

  return {
    isOpened,
    toggle
  }
})
