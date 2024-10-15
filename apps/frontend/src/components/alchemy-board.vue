<script setup lang="ts">
import AlchemyDraggableItem from './alchemy-draggable-item.vue'
import { ref, watchEffect } from 'vue'
import { useElementBounding, useEventListener } from '@vueuse/core'
import { useBoard } from '@/stores/use-board.js'
import { useGame } from '@/stores/use-game.js'
import { useOpenedElements } from '@/stores/use-opened-elements.js'
import { API_URL } from '@/constants.js'
import recipes from '@/assets/recipes.json'
import type { AlchemyElement, AlchemyElementOnBoard, Position } from '@/types.js'

const game = useGame()
const openedElements = useOpenedElements()

const board = useBoard()
const boardRef = ref<HTMLDivElement>()
const boardBounding = useElementBounding(boardRef)

watchEffect(() => {
  board.boardSize.left = boardBounding.left.value
  board.boardSize.right = boardBounding.right.value
  board.boardSize.top = boardBounding.top.value
  board.boardSize.bottom = boardBounding.bottom.value
})

function updatePosition(
  element: AlchemyElementOnBoard,
  position: Position
): void {
  element.position = position
  checkCollision(element)
}

function checkCollision(boardElement: AlchemyElementOnBoard): void {
  for (const boardItem of board.board) {
    if (boardItem === boardElement) continue
    if (boardElement.ended || boardItem.ended) continue
    if (
      boardElement.position.x < boardItem.position.x + board.elementSize.width &&
      boardElement.position.x + board.elementSize.width > boardItem.position.x &&
      boardElement.position.y < boardItem.position.y + board.elementSize.height &&
      boardElement.position.y + board.elementSize.height > boardItem.position.y
    ) {
      checkRecipe([boardElement.id, boardItem.id])
        .then((element) => {
          if (!element) return
          removeElement([boardItem, boardElement])
          сreateElement(boardItem, element)
          openedElements.addElement(element)
        })
    }
  }
}

async function checkRecipe(
  recipe: [string, string]
): Promise<AlchemyElementOnBoard | undefined> {
  for (const element of recipes) {
    if (element.recipes.length === 0) continue
    for (const elementRecipe of element.recipes) {
      if (
        (elementRecipe[0] === recipe[0] &&
          elementRecipe[1] === recipe[1]) ||
        (elementRecipe[0] === recipe[1] && elementRecipe[1] === recipe[0])
      ) {
        const openedRecipe: AlchemyElementOnBoard = {
          uuid: crypto.randomUUID(),
          id: element.id,
          name: element.name,
          ended: element.ended ?? false,
          position: game.getRandomPosition()
        }

        return openedRecipe
      }
    }
  }
}

function removeElement(boardElement: AlchemyElementOnBoard[]): void {
  board.board = board.board.filter(boardItem => {
    return boardElement.every(boardItem1 => boardItem1 !== boardItem)
  })
}

function сreateElement(
  boardElement: AlchemyElementOnBoard,
  newElement: AlchemyElement,
  isCopy = false
): void {
  board.board.push({
    ...newElement,
    uuid: crypto.randomUUID(),
    position: {
      x: isCopy ? boardElement.position.x + 15 : boardElement.position.x,
      y: isCopy ? boardElement.position.y + 15 : boardElement.position.y
    }
  })
}

useEventListener(boardRef, 'dblclick', (event) => {
  if ((event.target as HTMLElement).closest('.alchemy-item')) return

  const elements = game.basicElements.map((element) => {
    return {
      ...element,
      uuid: crypto.randomUUID(),
      position: game.getRandomPosition()
    }
  })

  board.board.push(...elements)
})
</script>

<template>
  <div ref="boardRef" class="board">
    <alchemy-draggable-item
      v-for="boardElement of board.board"
      v-bind:key="boardElement.uuid"
      v-bind:alchemy-element="boardElement"
      v-bind:board-bounding="boardBounding"
      v-on:position="updatePosition(boardElement, $event)"
      v-on:update:clone-element="сreateElement(boardElement, $event, true)"
      v-on:update:remove-element="removeElement([$event, boardElement])"
    />
  </div>
</template>

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
