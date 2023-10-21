<script setup lang="ts">
const props = defineProps<{
  id: string
  name: string
}>()
</script>

<template>
  <img class="image" v-bind:src="`images/${props.id}.webp`" />
  <p class="text">{{ props.name }}</p>
</template>

<style scoped>
.image {
  height: 64px;
  width: 64px;
  pointer-events: none;
}

.text {
  text-align: center;
}
</style>
