<template>
  <alchemy-counter />
  <alchemy-elements />
  <alchemy-board />

  <alchemy-guide />
  <alchemy-element-about />
</template>

<script setup lang="ts">
import AlchemyBoard from '@/components/alchemy-board.vue'
import AlchemyCounter from '@/components/alchemy-counter.vue'
import AlchemyElements from '@/components/alchemy-elements.vue'
import AlchemyGuide from './components/alchemy-guide.vue'
import AlchemyElementAbout from './components/alchemy-element-about.vue'
</script>
