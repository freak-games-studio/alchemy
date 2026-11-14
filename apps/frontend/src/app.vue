<template>
  <alchemy-board />
  <alchemy-elements />
  <alchemy-dock />
  <alchemy-guide />
  <alchemy-settings />
  <alchemy-confirm />
</template>

<script setup lang="ts">
import { provide } from 'vue'

import AlchemyDock from '@/features/dock/alchemy-dock.vue'
import AlchemyBoard from '@/features/board/alchemy-board.vue'
import AlchemyGuide from '@/features/guide/alchemy-guide.vue'
import AlchemyConfirm from '@/features/confirm/alchemy-confirm.vue'
import AlchemyElements from '@/features/catalog/alchemy-elements.vue'
import AlchemySettings from '@/features/settings/alchemy-settings.vue'
import { gameKey } from '@/game/injection'
import { createGame } from '@/game/create-game'

provide(gameKey, createGame())
</script>
