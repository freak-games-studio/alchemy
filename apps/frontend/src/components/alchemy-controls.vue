<script setup lang="ts">
import { useBoard } from '@/stores/use-board.js'
import { useMenu } from '@/stores/use-menu.js'
import { useGame } from '@/stores/use-game.js'

const game = useGame()
const board = useBoard()
const menu = useMenu()
</script>

<template>
  <div class="controls" v-on:dblclick.stop>
    <button class="button" v-on:click="game.$reset()">New game</button>
    <button class="button" v-on:click="board.$reset()">Clear board</button>
    <button
      class="button"
      v-bind:class="{ active: menu.isOpened }"
      v-on:click="menu.toggle()"
    >
      Elements
    </button>
    <div class="counter">{{ game.availableRecipes }}</div>
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
