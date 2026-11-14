<template>
  <alchemy-board />
  <alchemy-elements />
  <alchemy-dock />
  <alchemy-guide />
  <alchemy-settings />
  <alchemy-confirm />
  <alchemy-toast />
  <component
    :is="RecipeEditor"
    v-show="dev && recipeEditorOpen"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent, provide } from 'vue'

import AlchemyDock from '@/features/dock/alchemy-dock.vue'
import AlchemyBoard from '@/features/board/alchemy-board.vue'
import AlchemyGuide from '@/features/guide/alchemy-guide.vue'
import AlchemyToast from '@/features/toast/alchemy-toast.vue'
import AlchemyConfirm from '@/features/confirm/alchemy-confirm.vue'
import AlchemyElements from '@/features/catalog/alchemy-elements.vue'
import AlchemySettings from '@/features/settings/alchemy-settings.vue'
import { gameKey } from '@/game/injection'
import { createGame } from '@/game/create-game'
import { recipeEditorOpen } from '@/features/recipe-editor/open'

const dev = import.meta.env.DEV
const RecipeEditor = import.meta.env.DEV
  ? defineAsyncComponent(() => import('@/features/recipe-editor/alchemy-recipe-editor.vue'))
  : null

provide(gameKey, createGame())
</script>
