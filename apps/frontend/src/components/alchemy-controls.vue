<script setup lang="ts">
import { useBoard } from '@/stores/use-board.js'
import { useModal } from '@/stores/use-modal.js'
import { useAlchemyInfo } from '@/stores/use-alchemy-info.js'

const board = useBoard()
const alchemyInfo = useAlchemyInfo()
const modal = useModal()
</script>

<template>
  <div class="controls">
    <button class="button" v-on:dblclick.stop v-on:click="board.$reset()">Clear</button>
    <button
      class="button"
      v-bind:class="{ active: modal.isOpened }"
      v-on:dblclick.stop
      v-on:click="modal.toggle()"
    >
      Menu
    </button>
    <div class="counter">{{ alchemyInfo.availableRecipes }}</div>
  </div>
</template>

<style scoped>
.controls {
  position: absolute;
  width: 100%;
  height: 40px;
  z-index: 99;
}

.button {
  color: var(--vt-c-white);
  background: var(--vt-c-black-soft);
  border: none;
  outline: none;
  padding: 10px;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
}

.active {
  background: var(--vt-c-black);
}

.counter {
  position: absolute;
  top: 0;
  right: 0;
  padding: 5px;
  font-size: 16px;
  line-height: 1.8;
}
</style>
