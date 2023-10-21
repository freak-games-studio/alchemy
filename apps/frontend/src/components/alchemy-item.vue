<script setup lang="ts">
import AlchemyImage from './alchemy-image.vue'
import { useDraggable } from '@vueuse/core'
import { ref, watch } from 'vue'
import type { AlchemyElementOnBoard, Position } from '@/types.js'

const props = defineProps<{
  element: AlchemyElementOnBoard
}>()

const emits = defineEmits<{
  'position': [Position],
  'update:clone-element': [AlchemyElementOnBoard],
  'update:remove-element': [AlchemyElementOnBoard]
}>()

const el = ref<HTMLElement | null>(null)

const { position, style } = useDraggable(el, {
  initialValue: props.element.position,
  onEnd(position) {
    emits('position', position)
  }
})

watch(() => props.element.position, () => {
  position.value = props.element.position
})
</script>

<template>
  <div
    ref="el"
    class="alchemy-item"
    v-bind:style="style"
    v-on:dblclick="emits('update:clone-element', element)"
    v-on:contextmenu.prevent="emits('update:remove-element', element)"
  >
    <alchemy-image v-bind:id="element.id" v-bind:name="element.name" />
  </div>
</template>

<style scoped>
.alchemy-item {
  cursor: pointer;
  transition: 0.3s;
  touch-action: manipulation;
  position: fixed;
  inline-size: min-content;
  overflow-wrap: break-word;
  z-index: 999;
}

.alchemy-item:active {
  transition: none;
  z-index: 9999;
}
</style>
