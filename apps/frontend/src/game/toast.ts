import { ref } from 'vue'
import type { Ref } from 'vue'

const TOAST_MS = 2800

export interface ToastApi {
  message: Ref<string | null>
  show: (text: string) => void
}

export function createToast(): ToastApi {
  const message = ref<string | null>(null)
  const queue: string[] = []
  let timer = 0

  function pump() {
    const next = queue.shift()
    if (!next) {
      message.value = null
      timer = 0
      return
    }
    message.value = next
    timer = window.setTimeout(pump, TOAST_MS)
  }

  function show(text: string) {
    queue.push(text)
    if (timer) return
    pump()
  }

  return {
    message,
    show,
  }
}
