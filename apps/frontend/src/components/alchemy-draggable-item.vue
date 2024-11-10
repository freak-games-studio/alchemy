<script setup lang="ts">
import { useBoard } from '@/stores/use-board'
import { useSounds } from '@/stores/use-sounds'
import { clamp, useDraggable, useElementBounding } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import AlchemyItem from './alchemy-item.vue'
import type { AlchemyElementOnBoard, Position } from '@/types.js'

const props = defineProps<{
  alchemyElement: AlchemyElementOnBoard
}>()

const emits = defineEmits<{
  'position': [Position]
  'clone-element': [AlchemyElementOnBoard]
  'remove-element': [AlchemyElementOnBoard]
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
    emits('position', { x: xPosition.value, y: yPosition.value })
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

<template>
  <div
    ref="element"
    class="alchemy-item"
    :style="{ left: `${xPosition}px`, top: `${yPosition}px` }"
    @dblclick="emits('clone-element', alchemyElement)"
    @contextmenu.prevent="emits('remove-element', alchemyElement)"
  >
    <AlchemyItem :element="alchemyElement" />
  </div>
</template>

<style scoped>
.alchemy-item {
  cursor: pointer;
  touch-action: none;
  position: fixed;
  inline-size: min-content;
  overflow-wrap: break-word;
  z-index: 1;
  isolation: isolate;
}

.alchemy-item:active, .alchemy-item:hover {
  transition: none;
  z-index: 2;
}
</style>
