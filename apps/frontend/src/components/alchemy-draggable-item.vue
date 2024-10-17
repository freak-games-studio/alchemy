<script setup lang="ts">
import AlchemyItem from './alchemy-item.vue'
import { computed, ref, watch } from 'vue'
import { clamp, useDraggable, useElementBounding } from '@vueuse/core'
import { useSounds } from '@/stores/use-sounds'
import type { AlchemyElementOnBoard, Position } from '@/types.js'

const props = defineProps<{
  alchemyElement: AlchemyElementOnBoard,
  boardBounding: ReturnType<typeof useElementBounding>
}>()

const emits = defineEmits<{
  'position': [Position],
  'clone-element': [AlchemyElementOnBoard],
  'remove-element': [AlchemyElementOnBoard]
}>()

const sounds = useSounds()
const element = ref<HTMLElement | null>(null)
const { width, height } = useElementBounding(element)

const { position } = useDraggable(element, {
  initialValue: props.alchemyElement.position,
  onStart() {
    sounds.takingAudio.play()
  },
  onEnd() {
    emits('position', { x: xPosition.value, y: yPosition.value })
  }
})

const xPosition = computed(() => {
  return clamp(
    props.boardBounding.left.value,
    position.value.x,
    props.boardBounding.right.value - width.value
  )
})

const yPosition = computed(() => {
  return clamp(
    props.boardBounding.top.value,
    position.value.y,
    props.boardBounding.bottom.value - height.value
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
    <AlchemyItem v-bind:element="alchemyElement" />
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
