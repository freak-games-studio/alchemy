<template>
  <alchemy-panel
    :open="active === 'settings'"
    :side="dock"
    scroll
    @close="shell.close()"
  >
    <template #heading>
      <span class="h6">Настройки</span>
    </template>
    <div class="settings">
      <h3 class="settings__title settings__heading">
        <span>Громкость звука</span>
        <span class="settings__value">{{ settings.volume }}%</span>
      </h3>
      <input
        v-model.number="settings.volume"
        class="settings__slider"
        type="range"
        min="0"
        max="100"
        step="1"
      >

      <h3 class="settings__title">
        Размер элементов
      </h3>
      <div
        class="settings__segment"
        role="group"
        aria-label="Размер элементов"
      >
        <button
          v-for="option in elementSizes"
          :key="option.id"
          class="press settings__option"
          :class="{ 'settings__option--selected': settings.elementSize === option.id }"
          type="button"
          @click="settings.elementSize = option.id"
        >
          {{ option.label }}
        </button>
      </div>

      <template v-if="!mobile">
        <h3 class="settings__title">
          Положение панели
        </h3>
        <div
          class="settings__segment"
          role="group"
          aria-label="Положение панели"
        >
          <button
            v-for="option in dockSides"
            :key="option.id"
            class="press settings__option"
            :class="{ 'settings__option--selected': settings.dock === option.id }"
            type="button"
            @click="settings.dock = option.id"
          >
            {{ option.label }}
          </button>
        </div>
      </template>

      <h3 class="settings__title">
        Тема
      </h3>
      <div
        class="settings__themes"
        role="listbox"
        aria-label="Тема"
      >
        <button
          v-for="option in themes"
          :key="option.id"
          class="press settings__theme"
          :class="{ 'settings__theme--selected': settings.theme === option.id }"
          type="button"
          role="option"
          :aria-selected="settings.theme === option.id"
          @click="settings.theme = option.id"
        >
          <span
            class="settings__swatch"
            :data-theme="option.id"
          >
            <span class="settings__swatch-dot" />
          </span>
          {{ option.label }}
        </button>
      </div>

      <div class="settings__actions">
        <button
          class="press press--safe settings__action"
          type="button"
          @click="resetSettings"
        >
          Сбросить настройки
        </button>
        <button
          class="press press--danger settings__action"
          type="button"
          @click="startNewGame"
        >
          Начать новую игру
        </button>
      </div>
    </div>
  </alchemy-panel>
</template>

<script setup lang="ts">
import AlchemyPanel from '@/shared/ui/alchemy-panel.vue'
import { useGame } from '@/game/injection'
import { ELEMENT_SIZE_OPTIONS } from '@/game/settings'
import type { DockSide, ThemeName } from '@/game/settings'

const game = useGame()
const shell = game.session.shell
const active = shell.active
const settings = game.settings.values
const dock = game.settings.dock
const mobile = game.settings.mobile

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

  &__title {
    color: var(--foreground);
  }

  &__heading {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }

  &__value {
    color: var(--muted-foreground);
    font-variant-numeric: tabular-nums;
  }

  &__segment {
    display: flex;
    gap: 8px;
    margin: 8px 0 16px;
  }

  &__themes {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 8px 0 16px;
  }

  &__theme {
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 10px 12px;

    &--selected {
      border-color: var(--primary);
      background: color-mix(in srgb, var(--primary) 16%, transparent);
      color: var(--foreground);
    }
  }

  &__swatch {
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

  &__swatch-dot {
    border-radius: 50%;
    background: #e08a45;
    width: 8px;
    height: 8px;
  }

  &__option {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 10px 12px;
    width: 100%;

    &--selected {
      background: var(--primary);
      color: var(--primary-foreground);

      &:hover,
      &:active {
        background: var(--primary);
        color: var(--primary-foreground);
      }
    }
  }

  &__slider {
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

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__action {
    margin-top: 1rem;
    border-radius: 12px;
    padding: 12px 16px;
  }
}
</style>
