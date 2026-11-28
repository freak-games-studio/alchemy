<template>
  <div class="item">
    <img
      class="item__image"
      :src="spriteUrl(element.id)"
      :loading="lazy ? 'lazy' : undefined"
      :decoding="lazy ? 'async' : undefined"
      alt=""
    >
    <p
      class="item__text"
      :class="{ 'item__text--ended': element.ended }"
    >
      {{ element.name }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { spriteUrl } from '@/assets/sprite'

const props = defineProps<{
  element: {
    id: string
    name: string
    ended?: boolean
  }
  size: {
    width: number
    height: number
    fontSize: string
  }
  lazy?: boolean
}>()

const width = computed(() => `${props.size.width}px`)
const height = computed(() => `${props.size.height}px`)
const fontSize = computed(() => props.size.fontSize)
</script>

<style scoped lang="scss">
.item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  box-sizing: border-box;
  padding: 0 4px;
  width: calc(v-bind(width) * 2);
  height: auto;
  min-height: calc(v-bind(height) * 2);
  pointer-events: none;

  &__image {
    width: v-bind(width);
    height: v-bind(height);
  }

  &__text {
    display: block;
    margin: 0;
    width: 100%;
    min-width: 0;
    color: var(--foreground);
    font-size: v-bind(fontSize);
    line-height: 1.15;
    text-align: center;
    white-space: normal;
    overflow-wrap: break-word;

    &--ended::after {
      content: '*';
      color: var(--primary);
    }
  }
}
</style>
