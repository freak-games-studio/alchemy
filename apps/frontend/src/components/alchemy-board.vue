<script setup lang="ts">
import AlchemyItem from './alchemy-item.vue'
import AlchemyControls from './alchemy-controls.vue'
import AlchemyElements from './alchemy-elements.vue'
import { useEventListener } from '@vueuse/core'
import { useBoard } from '@/stores/use-board.js'
import { useModal } from '@/stores/use-modal.js'
import { useAlchemyInfo } from '@/stores/use-alchemy-info.js'
import { useOpenedElements } from '@/stores/use-opened-elements.js'
import { getRandomPosition } from '@/utils.js'
import { ELEMENT_HEIGHT, ELEMENT_WIDTH } from '@/constants.js'
import type { AlchemyElement, AlchemyElementOnBoard, Position } from '@/types.js'

const board = useBoard()
const alchemyInfo = useAlchemyInfo()
const openedElements = useOpenedElements()
const modal = useModal()

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
    if (
      boardElement.position.x < boardItem.position.x + ELEMENT_WIDTH &&
      boardElement.position.x + ELEMENT_WIDTH > boardItem.position.x &&
      boardElement.position.y < boardItem.position.y + ELEMENT_HEIGHT &&
      boardElement.position.y + ELEMENT_HEIGHT > boardItem.position.y
    ) {
      checkRecipe([boardElement.id, boardItem.id])
        .then((element) => {
          if (!element) return
          removeElement([boardItem, boardElement])
          spawnElement(boardItem, element)
          openedElements.addElement(element)
        })
    }
  }
}

async function checkRecipe(
  recipe: [string, string]
): Promise<AlchemyElementOnBoard | undefined> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/check-recipe`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipe })
      }
    )

    if (!response.ok) return

    const data = await response.json() as AlchemyElement
    const element: AlchemyElementOnBoard = {
      ...data,
      position: getRandomPosition()
    }

    return element
  } catch (err) {
    console.log(err)
  }
}

function removeElement(boardElement: AlchemyElementOnBoard[]): void {
  board.board = board.board.filter(boardItem => {
    return boardElement.every(boardItem1 => boardItem1 !== boardItem)
  })
}

function spawnElement(
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

useEventListener(document, 'dblclick', (event) => {
  if (
    !alchemyInfo.basicElements ||
    (event.target as HTMLElement).closest('.alchemy-item')
  ) return

  const elements = alchemyInfo.basicElements.map((element) => {
    return {
      ...element,
      uuid: crypto.randomUUID(),
      position: getRandomPosition()
    }
  })

  board.board.push(...elements)
})
</script>

<template>
  <alchemy-controls />
  <div class="board">
    <alchemy-item
      v-for="boardElement of board.board"
      v-bind:key="boardElement.uuid"
      v-bind:element="boardElement"
      v-on:position="updatePosition(boardElement, $event)"
      v-on:update:clone-element="spawnElement(boardElement, $event, true)"
      v-on:update:remove-element="removeElement([$event, boardElement])"
    />
  </div>
  <alchemy-elements
    v-if="modal.isOpened"
    v-on:create-element="board.board.push($event)"
  />
</template>

<style scoped>
.board {
  position: relative;
}
</style>
