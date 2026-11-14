<template>
  <alchemy-modal
    :open="active === 'settings'"
    @close="shell.close()"
  >
    <template #title>
      Настройки
    </template>
    <div class="settings">
      <h3 class="title heading">
        <span>Громкость звука</span>
        <span class="value">{{ settings.volume }}%</span>
      </h3>
      <input
        v-model.number="settings.volume"
        class="slider"
        type="range"
        min="0"
        max="100"
        step="1"
      >

      <h3 class="title">
        Размер элементов
      </h3>
      <div
        class="segment"
        role="group"
        aria-label="Размер элементов"
      >
        <button
          v-for="option in elementSizes"
          :key="option.id"
          class="press segment-button"
          :class="{ selected: settings.elementSize === option.id }"
          type="button"
          @click="settings.elementSize = option.id"
        >
          {{ option.label }}
        </button>
      </div>

      <h3 class="title">
        Положение панели
      </h3>
      <div
        class="segment"
        role="group"
        aria-label="Положение панели"
      >
        <button
          v-for="option in dockSides"
          :key="option.id"
          class="press segment-button"
          :class="{ selected: settings.dock === option.id }"
          type="button"
          @click="settings.dock = option.id"
        >
          {{ option.label }}
        </button>
      </div>

      <h3 class="title">
        Тема
      </h3>
      <div
        class="themes"
        role="listbox"
        aria-label="Тема"
      >
        <button
          v-for="option in themes"
          :key="option.id"
          class="press theme"
          :class="{ selected: settings.theme === option.id }"
          type="button"
          role="option"
          :aria-selected="settings.theme === option.id"
          @click="settings.theme = option.id"
        >
          <span
            class="swatch"
            :data-theme="option.id"
          >
            <span class="swatch-dot" />
          </span>
          {{ option.label }}
        </button>
      </div>

      <h3 class="title">
        <label class="check">
          <input
            v-model="settings.hideEndedElements"
            type="checkbox"
          >
          Скрыть завершенные элементы
        </label>
      </h3>

      <div class="button-group">
        <button
          class="press safe button-group__item"
          type="button"
          @click="resetSettings"
        >
          Сбросить настройки
        </button>
        <button
          class="press danger button-group__item"
          type="button"
          @click="startNewGame"
        >
          Начать новую игру
        </button>
      </div>
    </div>
  </alchemy-modal>
</template>

<script setup lang="ts">
import AlchemyModal from '@/shared/ui/alchemy-modal.vue'
import { useGame } from '@/game/injection'
import { ELEMENT_SIZE_OPTIONS } from '@/game/settings'
import type { DockSide, ThemeName } from '@/game/settings'

const game = useGame()
const shell = game.session.shell
const active = shell.active
const settings = game.settings.values

const elementSizes = ELEMENT_SIZE_OPTIONS

const dockSides: { id: DockSide, label: string }[] = [
  { id: 'bottom', label: 'Снизу' },
  { id: 'left', label: 'Слева' },
  { id: 'right', label: 'Справа' },
]

const themes: { id: ThemeName, label: string }[] = [
  { id: 'dark', label: 'Тёмная' },
  { id: 'light', label: 'Светлая' },
]

async function resetSettings() {
  const accepted = await game.session.confirm.ask('Вы точно хотите сбросить настройки?')
  if (!accepted) return
  game.settings.reset()
}

async function startNewGame() {
  const accepted = await game.session.confirm.ask('Вы точно хотите начать новую игру?')
  if (!accepted) return
  game.startNew()
}
</script>

<style scoped lang="scss">
.settings {
  display: flex;
  flex-direction: column;
  color: var(--muted-foreground);
}

.title {
  color: var(--foreground);
}

.heading {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.value {
  color: var(--muted-foreground);
  font-variant-numeric: tabular-nums;
}

.segment {
  display: flex;
  gap: 8px;
  margin: 8px 0 16px;
}

.themes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0 16px;
}

.theme {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;

  &.selected {
    border-color: var(--primary);
    background: color-mix(in srgb, var(--primary) 16%, transparent);
    color: var(--foreground);
  }
}

.swatch {
  display: flex;
  flex: none;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: #09090b;
  width: 22px;
  height: 22px;

  &[data-theme='light'] {
    background: #f4efe6;
  }
}

.swatch-dot {
  border-radius: 50%;
  background: #e08a45;
  width: 8px;
  height: 8px;
}

.segment-button {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  width: 100%;

  &.selected {
    background: var(--primary);
    color: var(--primary-foreground);

    &:hover,
    &:active {
      background: var(--primary);
      color: var(--primary-foreground);
    }
  }
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;

  input {
    flex: none;
    appearance: none;
    cursor: pointer;
    margin: 0;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: transparent;
    width: 18px;
    height: 18px;

    &:checked {
      box-shadow: inset 0 0 0 3px var(--card);
      border-color: var(--primary);
      background: var(--primary);
    }

    &:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }
  }
}

.slider {
  appearance: none;
  cursor: pointer;
  margin: 4px 0 12px;
  border-radius: 999px;
  background: transparent;
  width: 100%;
  height: 22px;

  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  &::-webkit-slider-runnable-track {
    border-radius: 999px;
    background: var(--border);
    height: 4px;
  }

  &::-webkit-slider-thumb {
    appearance: none;
    margin-top: -6px;
    border: none;
    border-radius: 50%;
    background: var(--primary);
    width: 16px;
    height: 16px;
  }

  &::-moz-range-track {
    border: none;
    border-radius: 999px;
    background: var(--border);
    height: 4px;
  }

  &::-moz-range-thumb {
    border: none;
    border-radius: 50%;
    background: var(--primary);
    width: 16px;
    height: 16px;
  }
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  &__item {
    margin-top: 1rem;
    border-radius: 12px;
    padding: 12px 16px;
  }
}
</style>
