<template>
  <Teleport to="body">
    <div
      ref="root"
      class="menu"
      data-context-menu
      role="menu"
      :style="{ left: `${left}px`, top: `${top}px` }"
    >
      <button
        v-for="item in items"
        :key="item.id"
        class="press menu__item"
        :class="{ 'menu__item--danger': item.danger }"
        type="button"
        role="menuitem"
        @click="choose(item.id)"
      >
        {{ item.label }}
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useEventListener } from '@vueuse/core'

export interface ContextMenuItem {
  id: string
  label: string
  danger?: boolean
}

const props = defineProps<{
  x: number
  y: number
  items: ContextMenuItem[]
}>()

const emit = defineEmits<{
  select: [id: string]
  close: []
}>()

const root = ref<HTMLElement | null>(null)
const left = ref(props.x)
const top = ref(props.y)

onMounted(() => {
  nextTick(() => {
    const node = root.value
    if (!node) return
    const rect = node.getBoundingClientRect()
    const pad = 8
    left.value = Math.min(Math.max(pad, props.x), window.innerWidth - rect.width - pad)
    top.value = Math.min(Math.max(pad, props.y), window.innerHeight - rect.height - pad)
  })
})

useEventListener(window, 'pointerdown', (event) => {
  const target = event.target
  if (target instanceof Node && root.value?.contains(target)) return
  emit('close')
}, { capture: true })

useEventListener(window, 'keydown', (event) => {
  if (event.key !== 'Escape') return
  event.stopImmediatePropagation()
  emit('close')
}, { capture: true })

function choose(id: string) {
  emit('select', id)
  emit('close')
}
</script>

<style scoped lang="scss">
.menu {
  display: flex;
  position: fixed;
  flex-direction: column;
  gap: 2px;
  z-index: 60;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--card);
  padding: 4px;
  min-width: 220px;

  &__item {
    border-radius: 10px;
    padding: 8px 12px;
    width: 100%;
    color: var(--foreground);
    font-size: 15px;
    text-align: left;

    &--danger {
      color: var(--destructive);

      &:hover,
      &:active {
        background: color-mix(in srgb, var(--destructive) 16%, transparent);
        color: var(--destructive);
      }
    }
  }
}
</style>
