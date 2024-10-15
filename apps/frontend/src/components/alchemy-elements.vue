<script setup lang="ts">
import { computed, ref } from 'vue'
import AlchemyItem from './alchemy-item.vue'
import { useGame } from '@/stores/use-game.js'
import { useBoard } from '@/stores/use-board.js'
import { useOpenedElements } from '@/stores/use-opened-elements.js'
import type { AlchemyElement, AlchemyElementOnBoard } from '@/types.js'

const game = useGame()
const board = useBoard()
const openedElements = useOpenedElements()

const searchInput = ref('')

const filteredElements = computed(() => {
  return openedElements.openedElements.filter((element) => {
    const value = searchInput.value.toLowerCase()
    const id = element.id.includes(value)
    const name = element.name.toLowerCase().includes(value)
    return id || name
  }) as AlchemyElementOnBoard[]
})

function createElement(element: Omit<AlchemyElement, 'uuid'>) {
  board.board.push({
    ...element,
    uuid: crypto.randomUUID(),
    position: game.getRandomPosition()
  })
}
</script>

<template>
  <div class="container">
    <input
      v-model="searchInput"
      class="search-input"
      type="text"
      name="search"
      placeholder="Искать элемент"
    />
    <div class="container-footer">
      <div class="elements-list">
        <div
          v-for="element in filteredElements"
          v-bind:key="element.id"
          class="element"
          v-on:click="createElement(element)"
        >
          <alchemy-item v-bind:element="element" />
        </div>
      </div>
      <div class="controls">
        <div class="button border-right" v-on:click="board.$reset()">Очистить поле</div>
        <div class="button" v-on:click="game.$reset()">Новая игра</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  background-color: var(--vt-c-black);
  width: 35%;
  display: flex;
  flex-direction: column;
}

.container-footer {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.elements-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: flex-start;
  align-items: center;
  height: 100%;
  gap: 1rem;
  overflow-x: auto;
}

@media screen and (max-width: 768px) {
  .container {
    width: 40%;
  }
}

.element {
  cursor: pointer;
}

.search-input {
  width: 100%;
  padding: 1rem;
  background: var(--vt-c-black);
  border: none;
  outline: none;
  border-bottom: 1px solid var(--vt-c-divider-dark-2);
  font-size: inherit;
  text-align: center;
  color: var(--vt-c-text-dark-2);
}

.controls {
  display: flex;
  border-top: 1px solid var(--vt-c-divider-dark-2);
}

.button {
  padding: 1rem;
  cursor: pointer;
  color: var(--vt-c-text-dark-2);
  background-color: var(--vt-c-black);
  font-size: inherit;
  text-align: center;
  width: 50%;
  height: 100%;
}

.border-right {
  border-right: 1px solid var(--vt-c-divider-dark-2);
}
</style>
