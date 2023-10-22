import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useModal = defineStore('modal', () => {
  const isOpened = ref(false)

  function toggle(): void {
    isOpened.value = !isOpened.value
  }

  return {
    isOpened,
    toggle
  }
})
