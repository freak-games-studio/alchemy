<script setup lang="ts">
import AlchemyItem from './alchemy-item.vue'
import { useBoard } from '@/stores/use-board'
import { useElements } from '@/stores/use-elements.js'
import { elementWidth, elementHeight } from '@/constants.js'
import type { BoardElement, Position } from '@/types.js'

const board = useBoard()
const elements = useElements()

function updatePosition(boardElement: BoardElement, position: Position): void {
  boardElement.position = position
  checkCollision(boardElement)
}

function checkCollision(boardElement: BoardElement): void {
  for (const boardItem of board.board) {
    if (boardItem === boardElement) continue

    if (
      boardElement.position.x < boardItem.position.x + elementWidth &&
      boardElement.position.x + elementWidth > boardItem.position.x &&
      boardElement.position.y < boardItem.position.y + elementHeight &&
      boardElement.position.y + elementHeight > boardItem.position.y
    ) {
      const currentRecept = [boardElement.class, boardItem.class]

      for (const element of elements.elements) {
        if (!element.recept) continue

        for (const [element1, element2] of element.recept) {
          if (
            currentRecept.indexOf(element1) !== -1 &&
            currentRecept.indexOf(element2) !== -1 &&
            currentRecept.indexOf(element1) !== currentRecept.indexOf(element2)
          ) {
            removeElement([boardItem, boardElement])
            spawnElement(boardItem, element)
            return
          }
        }
      }
    }
  }
}

function removeElement(boardElement: BoardElement[]): void {
  board.board = board.board.filter(boardItem => {
    return boardElement.every(boardItem1 => boardItem1 !== boardItem)
  })
}

function spawnElement(
  boardElement: BoardElement,
  newElement: BoardElement,
  isCopy = false
): void {
  board.board.push({
    ...newElement,
    id: crypto.randomUUID(),
    position: {
      x: isCopy ? boardElement.position.x + 15 : boardElement.position.x,
      y: isCopy ? boardElement.position.y + 15 : boardElement.position.y
    }
  })
}

function spawnInitialElements(): void {
  board.board.push(...elements.getInitialElements())
}
</script>

<template>
  <button v-on:click="board.$reset()">Reset</button>
  <button v-on:click="spawnInitialElements()">Spawn</button>
  <div class="board">
    <alchemy-item
      v-for="boardElement of board.board"
      v-bind:key="boardElement.id"
      v-bind:board-element="boardElement"
      v-on:update:position="$event => updatePosition(boardElement, $event)"
      v-on:update:clone-element="$event => spawnElement(boardElement, $event, true)"
      v-on:update:remove-element="$event => removeElement([$event, boardElement])"
    />
  </div>
</template>

<style scoped>
.board {
  position: relative;
}
</style>
