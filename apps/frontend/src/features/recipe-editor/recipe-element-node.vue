<template>
  <div
    class="node"
    :class="{ 'node--selected': props.data.current, 'node--ended': props.data.ended }"
  >
    <handle
      type="target"
      :position="Position.Top"
    />
    <img
      v-show="!failed"
      :key="src"
      class="node__sprite"
      :src="src"
      alt=""
      draggable="false"
      @error="failed = true"
    >
    <span
      v-if="failed"
      class="node__fallback"
    >{{ props.data.name.slice(0, 1) }}</span>
    <span class="node__name">{{ props.data.name }}</span>
    <span
      v-if="props.data.badges.length"
      class="node__badges"
    >{{ props.data.badges.join(' · ') }}</span>
    <handle
      type="source"
      :position="Position.Bottom"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

import { spriteUrl } from '@/assets/sprite'
import type { ElementNodeData } from './editor'

const props = defineProps<NodeProps<ElementNodeData>>()
const src = computed(() => spriteUrl(props.data.elementId))
const failed = ref(false)

watch(src, () => {
  failed.value = false
})
</script>

<style scoped lang="scss">
.node {
  display: flex;
  position: relative;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2px;
  box-sizing: border-box;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--card);
  padding: 6px 8px;
  width: 100%;
  height: 100%;
  color: var(--foreground);

  &--selected {
    box-shadow: 0 0 0 1px var(--primary);
    border-color: var(--primary);
  }

  &--ended &__name::after {
    content: '*';
    color: var(--primary);
  }

  &__sprite,
  &__fallback {
    width: 36px;
    height: 36px;
    pointer-events: none;
  }

  &__fallback {
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: var(--muted);
    color: var(--foreground);
    font-size: 16px;
  }

  &__name,
  &__badges {
    width: 100%;
    overflow: hidden;
    pointer-events: none;
    text-align: center;
  }

  &__name {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    color: var(--foreground);
    font-size: 13px;
    line-height: 1.15;
  }

  &__badges {
    color: var(--muted-foreground);
    font-size: 10px;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
