<script setup lang="ts">
import AlchemyDraggableItem from './alchemy-draggable-item.vue'
import { ref, watchEffect } from 'vue'
import { useElementBounding, useEventListener } from '@vueuse/core'
import { useBoard } from '@/stores/use-board.js'
import { useGame } from '@/stores/use-game.js'
import { useOpenedElements } from '@/stores/use-opened-elements.js'
import recipes from '@/assets/recipes.json'
import { useSounds } from '@/stores/use-sounds'
import type { AlchemyElement, AlchemyElementOnBoard, Position } from '@/types.js'
import { storeToRefs } from 'pinia'

const game = useGame()
const openedElements = useOpenedElements()

const sounds = useSounds()
const { board, boardSize, elementSize } = storeToRefs(useBoard())
const boardRef = ref<HTMLDivElement>()
const boardBounding = useElementBounding(boardRef)

watchEffect(() => {
  boardSize.value = {
    bottom: boardBounding.bottom.value,
    left: boardBounding.left.value,
    right: boardBounding.right.value,
    top: boardBounding.top.value
  }
})

function updatePosition(
  element: AlchemyElementOnBoard,
  position: Position
): void {
  element.position = position
  checkCollision(element)
}

function checkCollision(boardElement: AlchemyElementOnBoard): void {
  for (const boardItem of board.value) {
    if (boardItem === boardElement) continue
    if (boardElement.ended || boardItem.ended) continue
    if (
      boardElement.position.x < boardItem.position.x + elementSize.value.width &&
      boardElement.position.x + elementSize.value.width > boardItem.position.x &&
      boardElement.position.y < boardItem.position.y + elementSize.value.height &&
      boardElement.position.y + elementSize.value.height > boardItem.position.y
    ) {
      const element = checkRecipe([boardElement.id, boardItem.id])
      if (!element) return

      if (element.id === 'freak_games') {
        sounds.freakGamesAudio.play()
      }

      removeElement(boardItem)
      removeElement(boardElement)
      createElement(boardItem, element)
      openedElements.addElement(element)
    }
  }
}

function checkRecipe(
  recipe: [string, string]
): AlchemyElementOnBoard | undefined {
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

function removeElement(boardElement: AlchemyElementOnBoard): void {
  const elementIndex = board.value.findIndex((boardItem) => boardItem.uuid === boardElement.uuid)
  if (elementIndex === -1) return
  board.value.splice(elementIndex, 1)
}

function createElement(
  boardElement: AlchemyElementOnBoard,
  newElement: AlchemyElement,
  isCopy = false
): void {
  board.value.push({
    ...newElement,
    uuid: crypto.randomUUID(),
    position: {
      x: isCopy ? boardElement.position.x + 30 : boardElement.position.x,
      y: isCopy ? boardElement.position.y + 30 : boardElement.position.y
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

  board.value.push(...elements)
})
</script>

<template>
  <div ref="boardRef" class="board">
    <AlchemyDraggableItem
      v-for="boardElement of board"
      :key="boardElement.uuid"
      :alchemy-element="boardElement"
      :board-bounding="boardBounding"
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
