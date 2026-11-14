<template>
  <div
    ref="boardRef"
    class="board"
  >
    <alchemy-draggable-item
      v-for="boardElement of items"
      :key="boardElement.uuid"
      :alchemy-element="boardElement"
      @position="game.board.move(boardElement, $event)"
      @clone-element="game.board.clone(boardElement)"
      @remove-element="game.board.remove(boardElement)"
      @dragover.prevent
      @dragenter.prevent
    />
  </div>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'

import AlchemyDraggableItem from './alchemy-draggable-item.vue'
import { useGame } from '@/game/injection'

const game = useGame()
const boardRef = game.board.boardRef
const items = game.board.items

useEventListener(boardRef, 'click', (event) => {
  if (event.detail < 2 || event.detail % 2 !== 0) return
  if ((event.target as HTMLElement).closest('.alchemy-item')) return
  game.board.spawnBasics()
})
</script>

<style scoped lang="scss">
.board {
  background: var(--background);
  width: 100%;
  height: 100%;
}
</style>
