<script setup lang="ts">
import type { AlchemyElement } from '@/types.js'

defineProps<{
  element: AlchemyElement
}>()
</script>

<template>
  <img class="image" v-bind:src="`images/${element.id}.webp`" />
  <p class="text">
    {{ element.name }}
    <b v-if="element.ended" class="ended">*</b>
  </p>
</template>

<style scoped>
.image {
  height: 64px;
  width: 64px;
  pointer-events: none;
}

.ended {
  color: tomato;
}

.text {
  text-align: center;
}
</style>
