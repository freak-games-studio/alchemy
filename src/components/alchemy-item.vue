<script setup lang="ts">
import { useDraggable } from '@vueuse/core'
import { ref, watch } from 'vue'
import type { BoardElement, Position } from '@/types.js'

const props = defineProps<{
  boardElement: BoardElement
}>()

const emits = defineEmits<{
  'update:position': [Position],
  'update:clone-element': [BoardElement],
  'update:remove-element': [BoardElement]
}>()

const el = ref<HTMLElement | null>(null)

const { position, style } = useDraggable(el, {
  initialValue: props.boardElement.position,
  onEnd(position) {
    emits('update:position', position)
  }
})

watch(() => props.boardElement.position, () => {
  position.value = props.boardElement.position
})
</script>

<template>
  <div
    ref="el"
    class="alchemy-item"
    v-bind:style="style"
    v-on:dblclick="emits('update:clone-element', boardElement)"
    v-on:contextmenu.prevent="emits('update:remove-element', boardElement)"
  >
    <img
      class="alchemy-item__image"
      v-bind:src="`/images/${props.boardElement.class}.webp`"
      v-bind:alt="props.boardElement.description"
    />
    <p class="alchemy-item__text">{{ props.boardElement.text }}</p>
  </div>
</template>

<style scoped>
.alchemy-item {
  user-select: none;
  touch-action: manipulation;
  position: fixed;
  inline-size: min-content;
  overflow-wrap: break-word;
}

.alchemy-item:active {
  transition: none;
  z-index: 999;
}

.alchemy-item__image {
  height: 64px;
  width: 64px;
  user-select: none;
  pointer-events: none;
}

.alchemy-item__text {
  text-align: center;
}
</style>
