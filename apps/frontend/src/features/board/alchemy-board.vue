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
      @context-menu="openMenu(boardElement, $event)"
      @dragover.prevent
      @dragenter.prevent
    />
    <alchemy-context-menu
      v-if="menu"
      :x="menu.x"
      :y="menu.y"
      :items="menuItems"
      @select="onMenuSelect"
      @close="menu = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'

import AlchemyContextMenu from '@/shared/ui/alchemy-context-menu.vue'
import AlchemyDraggableItem from './alchemy-draggable-item.vue'
import { useGame } from '@/game/injection'
import type { AlchemyElementOnBoard } from '@/game/element'
import type { ContextMenuItem } from '@/shared/ui/alchemy-context-menu.vue'

const game = useGame()
const shell = game.session.shell
const about = game.session.about
const boardRef = game.board.boardRef
const items = game.board.items
const menu = ref<{ element: AlchemyElementOnBoard, x: number, y: number } | null>(null)
const menuItems: ContextMenuItem[] = [
  { id: 'remove', label: 'Удалить элемент', danger: true },
  { id: 'about', label: 'Информация об элементе' },
]

function openMenu(element: AlchemyElementOnBoard, point: { x: number, y: number }) {
  menu.value = { element, ...point }
}

function showInfo(element: AlchemyElementOnBoard) {
  if (shell.active.value !== 'elements') shell.toggle('elements')
  shell.restoreElements()
  about.open(element)
}

function onMenuSelect(id: string) {
  const current = menu.value
  if (!current) return
  if (id === 'remove') {
    game.board.remove(current.element)
    return
  }
  showInfo(current.element)
}

useEventListener(boardRef, 'click', (event) => {
  if (event.detail < 2 || event.detail % 2 !== 0) return
  if ((event.target as HTMLElement).closest('.draggable')) return
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
