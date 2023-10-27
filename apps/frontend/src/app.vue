<script setup lang="ts">
import AlchemyBoard from '@/components/alchemy-board.vue'
import AlchemyElements from '@/components/alchemy-elements.vue'
import AlchemyCounter from '@/components/alchemy-counter.vue'
</script>

<template>
  <div class="app">
    <alchemy-counter />
    <alchemy-elements />
    <alchemy-board />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  height: inherit;
  width: inherit;
}
</style>
