<template>
  <div
    ref="element"
    class="alchemy-item"
    :style="{ left: `${xPosition}px`, top: `${yPosition}px` }"
    @dblclick="$emit('clone-element', alchemyElement)"
    @contextmenu.prevent="$emit('remove-element', alchemyElement)"
  >
    <alchemy-item :element="alchemyElement" />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { clamp, useDraggable, useElementBounding } from '@vueuse/core'

import AlchemyItem from './alchemy-item.vue'
import { useBoard } from '@/stores/use-board'
import { useSounds } from '@/stores/use-sounds'
import type { AlchemyElementOnBoard, Position } from '@/types.js'

const props = defineProps<{
  alchemyElement: AlchemyElementOnBoard
}>()

const emit = defineEmits<{
  (event: 'position', value: Position): void
  (event: 'clone-element', value: AlchemyElementOnBoard): void
  (event: 'remove-element', value: AlchemyElementOnBoard): void
}>()

const { boardSize } = storeToRefs(useBoard())
const sounds = useSounds()
const element = ref<HTMLElement | null>(null)
const { width, height } = useElementBounding(element)

const { position } = useDraggable(element, {
  initialValue: props.alchemyElement.position,
  onStart() {
    sounds.playSound('taking')
  },
  onEnd() {
    // eslint-disable-next-line ts/no-use-before-define
    emit('position', { x: xPosition.value, y: yPosition.value })
  },
})

const xPosition = computed(() => {
  return clamp(
    boardSize.value.left,
    position.value.x,
    boardSize.value.right - width.value,
  )
})

const yPosition = computed(() => {
  return clamp(
    boardSize.value.top,
    position.value.y,
    boardSize.value.bottom - height.value,
  )
})

watch(() => props.alchemyElement.position, () => {
  position.value = props.alchemyElement.position
})
</script>

<style scoped>
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
