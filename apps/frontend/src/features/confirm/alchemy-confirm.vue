<template>
  <div
    v-if="isOpen"
    class="backdrop"
    @click.self="confirm.dismiss()"
  >
    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
    >
      <p class="message">
        {{ message }}
      </p>
      <div class="actions">
        <button
          class="press action"
          type="button"
          @click="confirm.dismiss()"
        >
          Нет
        </button>
        <button
          class="press danger action"
          type="button"
          @click="confirm.accept()"
        >
          Да
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'

import { useGame } from '@/game/injection'

const confirm = useGame().session.confirm
const isOpen = confirm.isOpen
const message = confirm.message

useEventListener(window, 'keydown', (event) => {
  if (event.key !== 'Escape' || !isOpen.value) return
  event.stopImmediatePropagation()
  confirm.dismiss()
}, { capture: true })
</script>

<style scoped lang="scss">
.backdrop {
  display: flex;
  position: fixed;
  justify-content: center;
  align-items: center;
  z-index: 1200;
  inset: 0;
  background: var(--overlay);
  padding: 24px;
}

.dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--card);
  padding: 24px;
  width: min(420px, 100%);
}

.message {
  color: var(--foreground);
  font-size: 20px;
  text-align: center;
}

.actions {
  display: flex;
  gap: 8px;
}

.action {
  border-radius: 12px;
  padding: 12px;
  width: 50%;
}
</style>
