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
        <path d="M12 7v14" />
        <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
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
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle
          cx="12"
          cy="12"
          r="3"
        />
      </svg>
      <span class="label">Настройки</span>
    </button>
    <button
      v-if="dev"
      class="press dock-button"
      type="button"
      aria-label="Рецепты"
      @click="recipeEditorOpen = true"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          cx="5.5"
          cy="5.5"
          r="2.5"
        />
        <circle
          cx="18.5"
          cy="5.5"
          r="2.5"
        />
        <circle
          cx="12"
          cy="18.5"
          r="2.5"
        />
        <path d="M6.62 7.74 10.88 16.26M17.38 7.74 13.12 16.26" />
      </svg>
      <span class="label">Рецепты</span>
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
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M10 11v6M14 11v6" />
      </svg>
      <span class="label">Очистить</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useGame } from '@/game/injection'
import { recipeEditorOpen } from '@/features/recipe-editor/open'

const dev = import.meta.env.DEV
const game = useGame()
const shell = game.session.shell
const active = shell.active
const dockRef = game.board.dockRef
const side = game.settings.dock
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
