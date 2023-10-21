<script setup lang="ts">
import { useDraggable } from '@vueuse/core'
import { ref, watch } from 'vue'
import type { AlchemyElementOnBoard, Position } from '@/types.js'

const props = defineProps<{
  alchemyElement: AlchemyElementOnBoard
}>()

const emits = defineEmits<{
  'update:position': [Position],
  'update:clone-element': [AlchemyElementOnBoard],
  'update:remove-element': [AlchemyElementOnBoard]
}>()

const el = ref<HTMLElement | null>(null)

const { position, style } = useDraggable(el, {
  initialValue: props.alchemyElement.position,
  onEnd(position) {
    emits('update:position', position)
  }
})

watch(() => props.alchemyElement.position, () => {
  position.value = props.alchemyElement.position
})
</script>

<template>
  <div
    ref="el"
    class="alchemy-item"
    v-bind:style="style"
    v-on:dblclick="emits('update:clone-element', alchemyElement)"
    v-on:contextmenu.prevent="emits('update:remove-element', alchemyElement)"
  >
    <img
      class="alchemy-item__image"
      v-bind:src="`images/${props.alchemyElement.id}.webp`"
      v-bind:alt="props.alchemyElement.description"
    />
    <p class="alchemy-item__text">{{ props.alchemyElement.name }}</p>
  </div>
</template>

<style scoped>
.alchemy-item {
  transition: 0.3s;
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
