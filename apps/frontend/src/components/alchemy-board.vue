<script setup lang="ts">
import recipes from '@/assets/recipes.json'
import { useBoard } from '@/stores/use-board.js'
import { useGame } from '@/stores/use-game.js'
import { useOpenedElements } from '@/stores/use-opened-elements.js'
import { useSounds } from '@/stores/use-sounds'
import { useEventListener } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import AlchemyDraggableItem from './alchemy-draggable-item.vue'
import type { AlchemyElement, AlchemyElementOnBoard, Position } from '@/types.js'

const game = useGame()
const openedElements = useOpenedElements()

const sounds = useSounds()
const { board, boardRef, elementSize } = storeToRefs(useBoard())

function updatePosition(
  element: AlchemyElementOnBoard,
  position: Position,
): void {
  element.position = position
  checkCollision(element)
}

function checkCollision(boardElement: AlchemyElementOnBoard): void {
  for (const boardItem of board.value) {
    if (boardItem === boardElement) continue
    if (boardElement.ended || boardItem.ended) continue
    if (
      boardElement.position.x < boardItem.position.x + elementSize.value.width
      && boardElement.position.x + elementSize.value.width > boardItem.position.x
      && boardElement.position.y < boardItem.position.y + elementSize.value.height
      && boardElement.position.y + elementSize.value.height > boardItem.position.y
    ) {
      const elements = checkRecipe([boardElement.id, boardItem.id])
      if (!elements.length) return

      elements.forEach((element, index) => {
        if (element.id === 'freak_games') {
          sounds.playSound('freakGames')
        }

        removeElement(boardItem)
        removeElement(boardElement)
        createElement(boardItem, element, index === 1)
        openedElements.addElement(element)
      })
    }
  }
}

function checkRecipe(
  recipe: [string, string],
): AlchemyElementOnBoard[] {
  const openedElements: AlchemyElementOnBoard[] = []

  for (const element of recipes) {
    if (!element.recipes.length) continue
    for (const elementRecipe of element.recipes) {
      if (
        (elementRecipe[0] === recipe[0] && elementRecipe[1] === recipe[1])
        || (elementRecipe[0] === recipe[1] && elementRecipe[1] === recipe[0])
      ) {
        openedElements.push({
          uuid: crypto.randomUUID(),
          id: element.id,
          name: element.name,
          ended: element.ended ?? false,
          position: game.getRandomPosition(),
        })
      }
    }
  }

  return openedElements
}

function removeElement(boardElement: AlchemyElementOnBoard): void {
  const elementIndex = board.value.findIndex((boardItem) => boardItem.uuid === boardElement.uuid)
  if (elementIndex === -1) return
  board.value.splice(elementIndex, 1)
}

function createElement(
  boardElement: AlchemyElementOnBoard,
  newElement: AlchemyElement,
  isCopy = false,
): void {
  board.value.push({
    ...newElement,
    uuid: crypto.randomUUID(),
    position: {
      x: isCopy ? boardElement.position.x + 30 : boardElement.position.x,
      y: isCopy ? boardElement.position.y + 30 : boardElement.position.y,
    },
  })
}

useEventListener(boardRef, 'dblclick', (event) => {
  if ((event.target as HTMLElement).closest('.alchemy-item')) return

  const elements = game.basicElements.map((element) => {
    return {
      ...element,
      uuid: crypto.randomUUID(),
      position: game.getRandomPosition(),
    }
  })

  board.value.push(...elements)
})
</script>

<template>
  <div ref="boardRef" class="board">
    <AlchemyDraggableItem
      v-for="boardElement of board"
      :key="boardElement.uuid"
      :alchemy-element="boardElement"
      @position="updatePosition(boardElement, $event)"
      @clone-element="createElement(boardElement, $event, true)"
      @remove-element="removeElement(boardElement)"
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
