<template>
  <Transition name="menu">
    <div
      v-if="open"
      class="panel"
      :class="[`panel--${side}`, { 'panel--minimized': minimized }]"
    >
      <div
        class="panel__card"
        :class="{ 'panel__card--wide': wide }"
      >
        <header
          class="panel__header"
          :class="{ 'panel__header--nested': nested }"
        >
          <div class="panel__heading">
            <slot name="heading" />
          </div>
          <button
            class="press panel__close"
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
          class="panel__body"
          :class="{ 'panel__body--scroll': scroll }"
        >
          <slot />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  open: boolean
  side: 'bottom' | 'left' | 'right'
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
</script>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.panel {
  display: flex;
  position: fixed;
  z-index: 20;

  &--bottom {
    bottom: calc(90px + env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
  }

  &--left {
    top: 50%;
    left: calc(120px + env(safe-area-inset-left));
    transform: translateY(-50%);
  }

  &--right {
    top: 50%;
    right: calc(120px + env(safe-area-inset-right));
    transform: translateY(-50%);
  }

  &--minimized {
    pointer-events: none;
  }

  &__card {
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

    .panel--left & {
      transform-origin: left center;
    }

    .panel--right & {
      transform-origin: right center;
    }

    .panel--minimized & {
      transform: scale(0.96);
      opacity: 0;
    }
  }

  &.menu-enter-active,
  &.menu-leave-active {
    transition: opacity 0.2s ease;
  }

  &.menu-enter-active &__card,
  &.menu-leave-active &__card {
    transition: transform 0.2s ease;
  }

  &.menu-enter-from,
  &.menu-leave-to {
    opacity: 0;
  }

  &.menu-enter-from#{&}--bottom &__card,
  &.menu-leave-to#{&}--bottom &__card {
    transform: translateY(8px) scale(0.96);
  }

  &.menu-enter-from#{&}--left &__card,
  &.menu-leave-to#{&}--left &__card {
    transform: translateX(-8px) scale(0.96);
  }

  &.menu-enter-from#{&}--right &__card,
  &.menu-leave-to#{&}--right &__card {
    transform: translateX(8px) scale(0.96);
  }

  &__heading {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 4px;
    min-width: 0;

    :deep(.h6) {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__header {
    display: flex;
    flex-shrink: 0;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid var(--border);
    padding: 0 12px 0 16px;
    height: 48px;

    &--nested {
      padding-left: 8px;
    }
  }

  &__close {
    @include icon-button;
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;

    &--scroll {
      padding: 16px 20px 20px;
      overflow: auto;
      overscroll-behavior: contain;
    }
  }

  @media screen and (max-width: 640px) {
    &--bottom {
      right: 8px;
      left: 8px;
      transform: none;
    }

    &__card {
      width: min(380px, calc(100vw - 100px));
      max-height: min(58dvh, 560px);

      .panel--bottom & {
        width: 100%;
      }
    }
  }

  @media screen and (min-width: 641px) {
    &__card--wide {
      width: min(960px, calc(100vw - 48px));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &__card,
    &.menu-enter-active,
    &.menu-leave-active,
    &.menu-enter-active &__card,
    &.menu-leave-active &__card,
    &--minimized &__card {
      transition: none;
    }
  }
}
</style>
