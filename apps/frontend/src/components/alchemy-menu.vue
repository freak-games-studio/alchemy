<script setup lang="ts">
import { computed, ref } from 'vue'
import AlchemyImage from './alchemy-image.vue'
import { useGame } from '@/stores/use-game.js'
import { useOpenedElements } from '@/stores/use-opened-elements.js'
import type { AlchemyElement, AlchemyElementOnBoard } from '@/types.js'

const emits = defineEmits<{
  'create-element': [AlchemyElementOnBoard]
}>()

const game = useGame()
const openedElements = useOpenedElements()
const searchInput = ref('')

const filteredElements = computed(() => {
  return openedElements.openedElements.filter((element) => {
    return element.name.toLowerCase().includes(searchInput.value.toLowerCase())
  }) as AlchemyElementOnBoard[]
})

function createElement(element: Omit<AlchemyElement, 'uuid'>) {
  emits('create-element', {
    ...element,
    uuid: crypto.randomUUID(),
    position: game.getRandomPosition()
  })
}
</script>

<template>
  <div class="elements-container" v-on:dblclick.stop>
    <input
      v-model="searchInput"
      class="search-input"
      type="text"
      name="search"
      placeholder="Search..."
    />
    <div v-if="filteredElements.length" class="elements">
      <div
        v-for="element in filteredElements"
        v-bind:key="element.id"
        class="elements-item"
        v-on:mousedown.left="createElement(element)"
      >
        <alchemy-image v-bind:element="element" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.elements-container {
  position: absolute;
  overflow-x: auto;
  z-index: 9999;
  max-height: 40%;
  width: 100%;
  top: 38px;
}

.elements {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  height: inherit;
  padding: 10px;
  padding-top: 3rem;
  gap: 10px;
  background-color: var(--vt-c-black);
}

.elements-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.3s;
  height: 100px;
  width: 100px;
  touch-action: manipulation;
}

.search-input {
  position: fixed;
  width: 100%;
  padding: 12px 20px;
  display: inline-block;
  background: var(--vt-c-black);
  color: var(--vt-c-white);
  font-family: inherit;
  font-size: inherit;
  border: none;
  outline: none;
}
</style>
