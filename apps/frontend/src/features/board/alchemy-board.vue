<template>
  <div
    ref="boardRef"
    class="board"
    @drop="onDrop"
    @dragover.prevent
    @dragenter.prevent
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
import type { AlchemyElement } from '@/game/element'

const game = useGame()
const boardRef = game.board.boardRef
const items = game.board.items

useEventListener(boardRef, 'dblclick', (event) => {
  if ((event.target as HTMLElement).closest('.alchemy-item')) return
  game.board.spawnBasics()
})

function onDrop(event: DragEvent) {
  if (!event.dataTransfer) return
  event.preventDefault()

  const elementData = JSON.parse(event.dataTransfer.getData('text/plain')) as {
    element: AlchemyElement
    x: number
    y: number
  }
  if (!elementData) return

  game.board.drop(elementData.element, {
    x: event.pageX - elementData.x,
    y: event.pageY - elementData.y,
  })
}
</script>

<style scoped>
.board {
  width: 65%;
}

@media screen and (max-width: 768px) {
  .board {
    width: 60%;
  }
}
</style>
