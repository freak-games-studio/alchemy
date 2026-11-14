<template>
  <nav
    ref="dockRef"
    class="dock"
    :class="side"
    aria-label="Разделы"
  >
    <button
      class="press dock-button"
      :class="{ active: active === 'elements' }"
      type="button"
      aria-label="Элементы"
      @click="shell.toggle('elements')"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          rx="1.5"
        />
        <rect
          x="14"
          y="3"
          width="7"
          height="7"
          rx="1.5"
        />
        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          rx="1.5"
        />
        <rect
          x="14"
          y="14"
          width="7"
          height="7"
          rx="1.5"
        />
      </svg>
      <span class="label">Элементы</span>
    </button>
    <button
      id="toggle-guide"
      class="press dock-button"
      :class="{ active: active === 'guide' }"
      type="button"
      aria-label="Справочник"
      @click="shell.toggle('guide')"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 6.2c-2.1-1.2-4.4-1.7-7.2-1.4v11.6c2.8-.3 5.1.2 7.2 1.4 2.1-1.2 4.4-1.7 7.2-1.4V4.8c-2.8-.3-5.1.2-7.2 1.4z" />
        <path d="M12 6.2v11.6" />
      </svg>
      <span class="label">Справочник</span>
    </button>
    <button
      class="press dock-button"
      :class="{ active: active === 'settings' }"
      type="button"
      aria-label="Настройки"
      @click="shell.toggle('settings')"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="3"
        />
        <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" />
      </svg>
      <span class="label">Настройки</span>
    </button>
    <span class="separator" />
    <button
      class="press dock-button"
      type="button"
      aria-label="Упорядочить"
      @click="game.board.arrange()"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
        />
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
      </svg>
      <span class="label">Упорядочить</span>
    </button>
    <button
      class="press dock-button"
      type="button"
      aria-label="Очистить поле"
      @click="game.board.clear()"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M20 12a8 8 0 1 1-2.2-5.5" />
        <path d="M20 4v5h-5" />
      </svg>
      <span class="label">Очистить</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useGame } from '@/game/injection'

const game = useGame()
const shell = game.session.shell
const active = shell.active
const dockRef = game.board.dockRef
const side = computed(() => game.settings.values.value.dock || 'bottom')
</script>

<style scoped lang="scss">
.dock {
  --dock-padding: 8px;

  display: flex;
  position: fixed;
  gap: 4px;
  z-index: 40;
  backdrop-filter: blur(16px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  border: 1px solid var(--border);
  border-radius: 22px;
  background: color-mix(in srgb, var(--card) 88%, transparent);
  padding: var(--dock-padding);
}

.dock.bottom {
  bottom: calc(var(--dock-padding) + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
}

.dock.left,
.dock.right {
  top: 50%;
  flex-direction: column;
  transform: translateY(-50%);
}

.dock.left {
  left: calc(var(--dock-padding) + env(safe-area-inset-left));
}

.dock.right {
  right: calc(var(--dock-padding) + env(safe-area-inset-right));
}

.dock-button {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2px;
  border-radius: 14px;
  padding: 6px 8px;
  min-width: 64px;
  min-height: 52px;
  color: var(--muted-foreground);
}

.dock-button svg {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
  width: 22px;
  height: 22px;
}

.dock-button.active {
  background: color-mix(in srgb, var(--primary) 22%, transparent);
  color: var(--foreground);
}

.label {
  font-size: 11px;
  line-height: 1.1;
}

.separator {
  align-self: stretch;
  margin: 6px 4px;
  background: var(--border);
  width: 1px;
}

.dock.left .separator,
.dock.right .separator {
  margin: 4px 6px;
  width: auto;
  height: 1px;
}

@media screen and (max-width: 420px) {
  .label {
    display: none;
  }

  .dock-button {
    min-width: 48px;
    min-height: 48px;
  }
}
</style>
