<template>
  <div class="item">
    <img
      class="image"
      :src="sprites[element.id]"
    >
    <p
      class="text"
      :class="[{ ended: element.ended }]"
    >
      {{ element.name }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { sprites } from '@/assets/sprites'
import { useGame } from '@/game/injection'
import type { AlchemyElement } from '@/game/element'

defineProps<{
  element: AlchemyElement
}>()

const elementSize = useGame().board.elementSize
const width = computed(() => `${elementSize.value.width}px`)
const height = computed(() => `${elementSize.value.height}px`)
</script>

<style scoped>
.item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  width: calc(v-bind(width) * 2);
  height: calc(v-bind(height) * 2);
  pointer-events: none;
}

.image {
  width: v-bind(width);
  height: v-bind(height);
}

.text {
  display: flex;
  gap: 6px;
  margin: 0 4px;
  font-size: v-bind('elementSize.fontSize');
  text-align: center;
}

.ended::after {
  content: '*';
  color: tomato;
}
</style>
