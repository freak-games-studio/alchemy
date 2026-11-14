<template>
  <Transition name="menu">
    <div
      v-if="open"
      class="anchor"
      :class="[side, { minimized }]"
    >
      <div
        class="panel"
        :class="{ wide }"
      >
        <header
          class="panel-header"
          :class="{ nested }"
        >
          <div class="heading">
            <slot name="heading" />
          </div>
          <button
            class="press icon"
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
        <div
          class="body"
          :class="{ scroll }"
        >
          <slot />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useGame } from '@/game/injection'

withDefaults(defineProps<{
  open: boolean
  minimized?: boolean
  nested?: boolean
  scroll?: boolean
  wide?: boolean
}>(), {
  minimized: false,
  nested: false,
  scroll: false,
  wide: false,
})

const emit = defineEmits<{
  close: []
}>()

const game = useGame()
const side = game.settings.dock
</script>

<style scoped lang="scss">
.anchor {
  display: flex;
  position: fixed;
  z-index: 20;
}

.anchor.bottom {
  bottom: calc(90px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
}

.anchor.left {
  top: 50%;
  left: calc(120px + env(safe-area-inset-left));
  transform: translateY(-50%);
}

.anchor.right {
  top: 50%;
  right: calc(120px + env(safe-area-inset-right));
  transform: translateY(-50%);
}

.anchor.minimized {
  pointer-events: none;
}

.panel {
  display: flex;
  flex-direction: column;
  transform-origin: center bottom;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--card);
  width: min(720px, calc(100vw - 108px));
  max-height: min(70dvh, 680px);
  overflow: hidden;
}

.anchor.left .panel {
  transform-origin: left center;
}

.anchor.right .panel {
  transform-origin: right center;
}

.anchor.minimized .panel {
  transform: scale(0.96);
  opacity: 0;
}

.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.2s ease;
}

.menu-enter-active .panel,
.menu-leave-active .panel {
  transition: transform 0.2s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
}

.menu-enter-from.bottom .panel,
.menu-leave-to.bottom .panel {
  transform: translateY(8px) scale(0.96);
}

.menu-enter-from.left .panel,
.menu-leave-to.left .panel {
  transform: translateX(-8px) scale(0.96);
}

.menu-enter-from.right .panel,
.menu-leave-to.right .panel {
  transform: translateX(8px) scale(0.96);
}

.heading {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.heading :deep(.title) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-header {
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--border);
  padding: 0 12px 0 16px;
  height: 48px;
}

.panel-header.nested {
  padding-left: 8px;
}

.icon {
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  width: 36px;
  height: 36px;
}

.icon svg {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
  width: 18px;
  height: 18px;
}

.body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.body.scroll {
  padding: 16px 20px 20px;
  overflow: auto;
  overscroll-behavior: contain;
}

@media screen and (max-width: 640px) {
  .anchor.bottom {
    right: 8px;
    left: 8px;
    transform: none;
  }

  .anchor.bottom .panel,
  .panel {
    width: min(380px, calc(100vw - 100px));
    max-height: min(58dvh, 560px);
  }

  .anchor.bottom .panel {
    width: 100%;
  }
}

@media screen and (min-width: 641px) {
  .panel.wide {
    width: min(960px, calc(100vw - 48px));
  }
}

@media (prefers-reduced-motion: reduce) {
  .panel,
  .menu-enter-active,
  .menu-leave-active,
  .menu-enter-active .panel,
  .menu-leave-active .panel,
  .anchor.minimized .panel {
    transition: none;
  }
}
</style>
