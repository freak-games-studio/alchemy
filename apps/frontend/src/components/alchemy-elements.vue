<template>
  <div class="container">
    <input
      v-model="searchInput"
      class="search-input"
      type="text"
      name="search"
      placeholder="Искать элемент..."
      @dragover.prevent
    >
    <div class="elements-list">
      <div
        v-for="element in filteredElements"
        :key="element.id"
        class="element"
        draggable="true"
        @click="game.createElement(element)"
        @dragstart="dragStart($event, element)"
        @contextmenu.prevent="() => {
          guide.closeGuide()
          elementAbout.openElementAbout(element)
        }"
      >
        <alchemy-item :element="element" />
      </div>
    </div>
    <div class="controls">
      <div
        id="toggle-guide"
        class="button border-right"
        @click="guide.toggleGuide()"
        @drop="game.activateCheatCode($event)"
        @dragover.prevent
        @dragenter.prevent
      >
        Об игре
      </div>
      <div
        class="button"
        @click="board.$reset()"
      >
        Очистить поле
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

import AlchemyItem from './alchemy-item.vue'
import { useGame } from '@/stores/use-game'
import { useGuide } from '@/stores/use-guide'
import { useBoard } from '@/stores/use-board.js'
import { useSettings } from '@/stores/use-settings'
import { useElementAbout } from '@/stores/use-element-about'
import { useOpenedElements } from '@/stores/use-opened-elements.js'
import type { AlchemyElement } from '@/types.js'

const guide = useGuide()
const game = useGame()
const board = useBoard()
const { settings } = storeToRefs(useSettings())
const elementAbout = useElementAbout()
const openedElements = useOpenedElements()
const searchInput = ref('')

const filteredElements = computed(() => {
  return openedElements.openedElements.filter((element) => {
    if (settings.value.hideEndedElements && element.ended) return false
    const value = searchInput.value.toLowerCase()
    const id = element.id.includes(value)
    const name = element.name.toLowerCase().includes(value)
    return id || name
  })
})

function dragStart(event: DragEvent, element: AlchemyElement) {
  if (!event.dataTransfer) return
  event.dataTransfer.setData('text/plain', JSON.stringify({
    element,
    x: event.offsetX,
    y: event.offsetY,
  }))
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  background-color: var(--vt-c-black);
  width: 35%;
}

.elements-list {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  height: 100%;
  overflow-x: hidden;
  overscroll-behavior: contain;
}

@media screen and (max-width: 768px) {
  .container {
    width: 40%;
  }
}

.element {
  /* remove background on drag element */
  transform: translate(0, 0);
  cursor: pointer;
}

.search-input {
  outline: none;
  border: none;
  border-bottom: 1px solid var(--vt-c-divider-dark-2);
  background: var(--vt-c-black);
  padding: 1rem;
  width: 100%;
  height: 52px;
  color: var(--vt-c-text-dark-2);
  font-size: 18px;
  text-align: center;
}

.controls {
  display: flex;
  border-top: 1px solid var(--vt-c-divider-dark-2);
}

.button {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  background-color: var(--vt-c-black);
  padding: 12px;
  width: 50%;
  height: 100%;
  color: var(--vt-c-text-dark-2);
  font-size: inherit;
  text-align: center;
}

.border-right {
  border-right: 1px solid var(--vt-c-divider-dark-2);
}
</style>
