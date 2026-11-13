<template>
  <div class="counter">
    {{ counter }}
  </div>
</template>

<script setup lang="ts">
import { useGame } from '@/game/injection'

const counter = useGame().catalog.counter
</script>

<style scoped>
.counter {
  position: absolute;
  top: 4px;
  right: 10px;
  z-index: 3;
  pointer-events: none;
  font-size: 18px;
}
</style>
