<template>
  <Transition name="toast">
    <div
      v-if="message"
      class="toast"
      role="status"
    >
      {{ message }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useGame } from '@/game/injection'

const message = useGame().toast.message
</script>

<style scoped lang="scss">
.toast {
  position: fixed;
  top: calc(16px + env(safe-area-inset-top));
  left: 50%;
  transform: translateX(-50%);
  z-index: 80;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card);
  padding: 12px 20px;
  max-width: min(560px, calc(100vw - 32px));
  color: var(--foreground);
  text-align: center;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  transform: translateX(-50%) translateY(-8px);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }
}
</style>
