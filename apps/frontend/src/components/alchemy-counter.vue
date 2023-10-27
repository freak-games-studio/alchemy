<script setup lang="ts">
import { useGame } from '@/stores/use-game.js'

const game = useGame()
</script>

<template>
  <div class="counter">{{ game.availableRecipes }}</div>
</template>

<style scoped>
.counter {
  position: absolute;
  top: 0;
  right: 5px;
  padding: 5px;
  font-size: 16px;
  line-height: 1.8;
  z-index: 3;
}
</style>
