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
    if (boardItem.uuid === boardElement.uuid) continue
    if (boardElement.ended || boardItem.ended) continue
    if (
      boardElement.position.x >= boardItem.position.x + elementSize.value.width
      || boardElement.position.x + elementSize.value.width <= boardItem.position.x
      || boardElement.position.y >= boardItem.position.y + elementSize.value.height
      || boardElement.position.y + elementSize.value.height <= boardItem.position.y
    ) {
      continue
    }

    const elements = checkRecipe([boardElement.id, boardItem.id])
    if (!elements.length) break

    elements.forEach((element, elementIndex) => {
      if (element.id === 'freak_games') {
        sounds.playSound('freakGames')
      }

      removeElement(boardItem)
      removeElement(boardElement)
      createElement(
        boardItem.position,
        element,
        elementIndex >= 1 ? elementIndex : 0,
      )
      openedElements.addElement(element)
    })

    break
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
  position: Position,
  element: AlchemyElement,
  positionOffset = 0,
): void {
  board.value.push({
    ...element,
    uuid: crypto.randomUUID(),
    position: {
      x: positionOffset ? position.x + (30 * positionOffset) : position.x,
      y: positionOffset ? position.y + (30 * positionOffset) : position.y,
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

function onDrop(event: DragEvent) {
  if (!event.dataTransfer) return
  event.preventDefault()

  const elementData = JSON.parse(event.dataTransfer.getData('text/plain')) as {
    element: AlchemyElement
    x: number
    y: number
  }
  if (!elementData) return

  const position = {
    x: event.pageX - elementData.x,
    y: event.pageY - elementData.y,
  }

  const newElement = {
    ...elementData.element,
    uuid: crypto.randomUUID(),
    position,
  }

  board.value.push(newElement)
  checkCollision(newElement)
}
</script>

<template>
  <div
    ref="boardRef"
    class="board"
    @drop="onDrop"
    @dragover.prevent
    @dragenter.prevent
  >
    <AlchemyDraggableItem
      v-for="boardElement of board"
      :key="boardElement.uuid"
      :alchemy-element="boardElement"
      @position="updatePosition(boardElement, $event)"
      @clone-element="createElement(boardElement.position, $event, 1)"
      @remove-element="removeElement(boardElement)"
      @dragover.prevent
      @dragenter.prevent
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
