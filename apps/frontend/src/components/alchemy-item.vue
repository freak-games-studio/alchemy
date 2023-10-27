<script setup lang="ts">
import { computed } from 'vue'
import { useBoard } from '@/stores/use-board'
import type { AlchemyElement } from '@/types.js'

defineProps<{
  element: AlchemyElement
}>()

const game = useBoard()
const width = computed(() => `${game.elementSize.width}px`)
const height = computed(() => `${game.elementSize.height}px`)
</script>

<template>
  <div class="item">
    <img class="image" v-bind:src="`images/${element.id}.webp`" />
    <p v-bind:class="['text', { ended: element.ended }]">
      {{ element.name }}
    </p>
  </div>
</template>

<style scoped>
.item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(v-bind(height) * 2);
  width: calc(v-bind(width) * 2);
  pointer-events: none;
}

.image {
  height: v-bind(height);
  width: v-bind(width);
}

.text {
  display: flex;
  gap: 6px;
  text-align: center;
  word-break: break-word;
  margin-left: 4px;
  margin-right: 4px;
}

.ended::after {
  content: '*';
  color: tomato;
}
</style>
