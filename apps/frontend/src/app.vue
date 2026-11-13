<template>
  <alchemy-counter />
  <alchemy-elements />
  <alchemy-board />

  <alchemy-guide />
  <alchemy-element-about />
</template>

<script setup lang="ts">
import { provide } from 'vue'

import AlchemyBoard from '@/features/board/alchemy-board.vue'
import AlchemyGuide from '@/features/guide/alchemy-guide.vue'
import AlchemyCounter from '@/features/counter/alchemy-counter.vue'
import AlchemyElements from '@/features/catalog/alchemy-elements.vue'
import AlchemyElementAbout from '@/features/about/alchemy-element-about.vue'
import { gameKey } from '@/game/injection'
import { createGame } from '@/game/create-game'

provide(gameKey, createGame())
</script>
