<template>
  <div
    ref="element"
    class="alchemy-item"
    :style="{ left: `${xPosition}px`, top: `${yPosition}px` }"
    @dblclick="$emit('clone-element', alchemyElement)"
    @contextmenu.prevent="$emit('remove-element', alchemyElement)"
    @pointerdown="onHoldStart"
    @pointermove="onHoldMove"
    @pointerup="onHoldEnd"
    @pointercancel="onHoldEnd"
  >
    <alchemy-item :element="alchemyElement" />
  </div>
</template>

<script setup lang="ts">
import { clamp, useDraggable } from '@vueuse/core'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

import AlchemyItem from '@/shared/ui/alchemy-item.vue'
import { useGame } from '@/game/injection'
import type { AlchemyElementOnBoard, Position } from '@/game/element'

const props = defineProps<{
  alchemyElement: AlchemyElementOnBoard
}>()

const emit = defineEmits<{
  (event: 'position', value: Position): void
  (event: 'clone-element', value: AlchemyElementOnBoard): void
  (event: 'remove-element', value: AlchemyElementOnBoard): void
}>()

const HOLD_MS = 550
const HOLD_CANCEL_PX = 8

const game = useGame()
const boardSize = game.board.boardSize
const element = ref<HTMLElement | null>(null)
const box = ref({ width: 0, height: 0 })
let holdTimer = 0
let holdOrigin = { x: 0, y: 0 }
let removedByHold = false

function cancelHold() {
  window.clearTimeout(holdTimer)
  holdTimer = 0
}

function onHoldStart(event: PointerEvent) {
  if (event.button !== 0) return
  removedByHold = false
  holdOrigin = { x: event.clientX, y: event.clientY }
  cancelHold()
  holdTimer = window.setTimeout(() => {
    removedByHold = true
    emit('remove-element', props.alchemyElement)
  }, HOLD_MS)
}

function onHoldMove(event: PointerEvent) {
  if (!holdTimer) return
  const distance = Math.hypot(event.clientX - holdOrigin.x, event.clientY - holdOrigin.y)
  if (distance > HOLD_CANCEL_PX) cancelHold()
}

function onHoldEnd() {
  cancelHold()
}

onUnmounted(cancelHold)

function measure() {
  const node = element.value
  if (!node) return
  box.value = {
    width: node.offsetWidth,
    height: node.offsetHeight,
  }
}

onMounted(() => nextTick(measure))
watch(() => game.board.elementSize.value.width, () => nextTick(measure))

const { position } = useDraggable(element, {
  initialValue: props.alchemyElement.position,
  onStart() {
    game.audio.play('taking')
  },
  onEnd() {
    if (removedByHold) return
    // eslint-disable-next-line ts/no-use-before-define
    emit('position', { x: xPosition.value, y: yPosition.value })
  },
})

const xPosition = computed(() => {
  return clamp(
    boardSize.value.left,
    position.value.x,
    boardSize.value.right - box.value.width,
  )
})

const yPosition = computed(() => {
  return clamp(
    boardSize.value.top,
    position.value.y,
    boardSize.value.bottom - box.value.height,
  )
})

watch(() => props.alchemyElement.position, () => {
  position.value = props.alchemyElement.position
})
</script>

<style scoped lang="scss">
.alchemy-item {
  position: fixed;
  z-index: 1;
  cursor: pointer;
  isolation: isolate;
  inline-size: min-content;
  touch-action: none;
  overflow-wrap: break-word;
}

.alchemy-item:active,
.alchemy-item:hover {
  z-index: 2;
  transition: none;
}
</style>
