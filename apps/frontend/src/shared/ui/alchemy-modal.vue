<template>
  <div
    v-if="open"
    class="backdrop"
    @click.self="emit('close')"
  >
    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
    >
      <header class="header">
        <h2 class="h6">
          <slot name="title" />
        </h2>
        <button
          class="press close"
          type="button"
          aria-label="Закрыть"
          @click="emit('close')"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>
      <div class="body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<style scoped lang="scss">
.backdrop {
  display: flex;
  position: fixed;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  inset: 0;
  background: var(--overlay);
  padding: 12px;
}

.dialog {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--card);
  width: min(640px, 100%);
  max-height: min(86dvh, 760px);
  overflow: hidden;
}

.header {
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--border);
  padding: 0 16px 0 24px;
  height: 52px;
}

.close {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  width: 36px;
  height: 36px;
}

.close svg {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 1.6;
  width: 20px;
  height: 20px;
}

.body {
  flex: 1;
  padding: 24px;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}

@media screen and (max-width: 640px) {
  .dialog {
    max-height: calc(100dvh - 24px);
  }
}
</style>
