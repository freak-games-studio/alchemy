<script setup lang="ts">
import { useBoard } from '@/stores/use-board.js'
import { useAlchemyInfo } from '@/stores/use-alchemy-info.js'

const board = useBoard()
const alchemyInfo = useAlchemyInfo()
</script>

<template>
  <button class="button" v-on:dblclick.stop v-on:click="board.$reset()">Clear</button>
  <h1 class="counter">{{ alchemyInfo.availableRecipes }}</h1>
</template>

<style scoped>
.button {
  color: #ffffff;
  background: #222222;
  border: none;
  outline: none;
  padding: 10px;
}

.counter {
  position: absolute;
  top: 4px;
  right: 8px;
  font-size: 16px;
  z-index: 99999;
}
</style>
