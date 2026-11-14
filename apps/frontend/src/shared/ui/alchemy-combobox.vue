<template>
  <div
    ref="root"
    class="combobox"
  >
    <button
      class="press trigger"
      type="button"
      :aria-label="label ? `${label}: ${currentLabel}` : undefined"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <span class="current">{{ currentLabel }}</span>
      <svg
        class="chevron"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
    <Teleport to="body">
      <div
        v-if="open"
        ref="menu"
        class="menu"
        :style="menuStyle"
      >
        <input
          ref="search"
          v-model="query"
          class="search"
          type="text"
          placeholder="Поиск"
          @keydown="onKey"
        >
        <p
          v-if="!shown.length"
          class="empty"
        >
          Ничего не найдено
        </p>
        <ul
          v-else
          class="list"
          role="listbox"
        >
          <li
            v-for="(option, index) in shown"
            :key="`${option.id}:${index}`"
          >
            <button
              class="press option"
              type="button"
              role="option"
              :aria-selected="option.id === value"
              :class="{ picked: option.id === value, active: index === cursor }"
              @click="choose(option.id)"
            >
              <span class="option-label">{{ option.label }}</span>
              <svg
                v-if="option.id === value"
                class="check"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="m5 12 5 5L20 7" />
              </svg>
            </button>
          </li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { computed, nextTick, ref, watch } from 'vue'

export interface ComboboxOption {
  id: string
  label: string
}

const props = defineProps<{
  value: string
  options: ComboboxOption[]
  placeholder?: string
  label?: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const LIMIT = 80

const root = ref<HTMLElement>()
const menu = ref<HTMLElement>()
const search = ref<HTMLInputElement>()
const open = ref(false)
const query = ref('')
const cursor = ref(0)
const menuStyle = ref({ top: '0px', left: '0px', width: '0px' })

const currentLabel = computed(() => {
  return props.options.find(option => option.id === props.value)?.label || props.placeholder || ''
})

const matched = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return props.options
  return props.options.filter((option) => {
    return option.label.toLowerCase().includes(needle) || option.id.toLowerCase().includes(needle)
  })
})

const shown = computed(() => matched.value.slice(0, LIMIT))

watch(query, () => {
  cursor.value = 0
  if (open.value) nextTick(place)
})

useEventListener('pointerdown', onPointerDown)
useEventListener(window, 'resize', place)
useEventListener(window, 'scroll', place, true)

function toggle() {
  open.value = !open.value
  if (!open.value) return
  query.value = ''
  cursor.value = Math.max(0, shown.value.findIndex(option => option.id === props.value))
  nextTick(() => {
    place()
    search.value?.focus()
  })
}

function place() {
  if (!open.value) return
  const anchor = root.value?.getBoundingClientRect()
  const popup = menu.value
  if (!anchor || !popup) return
  const gap = 6
  const width = Math.max(anchor.width, 220)
  const menuHeight = popup.offsetHeight
  const spaceBelow = window.innerHeight - anchor.bottom - gap
  const spaceAbove = anchor.top - gap
  let top = anchor.bottom + gap
  if (spaceBelow < menuHeight && spaceAbove > spaceBelow) top = anchor.top - menuHeight - gap
  top = Math.max(gap, Math.min(top, window.innerHeight - menuHeight - gap))
  const left = Math.max(gap, Math.min(anchor.left, window.innerWidth - width - gap))
  menuStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
  }
}

function onPointerDown(event: PointerEvent) {
  if (!open.value) return
  const target = event.target
  if (!(target instanceof Node)) return
  if (root.value?.contains(target) || menu.value?.contains(target)) return
  open.value = false
}

function choose(id: string) {
  emit('select', id)
  open.value = false
  query.value = ''
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open.value = false
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    cursor.value = Math.min(shown.value.length - 1, cursor.value + 1)
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    cursor.value = Math.max(0, cursor.value - 1)
    return
  }
  if (event.key !== 'Enter') return
  event.preventDefault()
  const option = shown.value[cursor.value]
  if (option) choose(option.id)
}
</script>

<style scoped lang="scss">
.combobox {
  width: 100%;
  min-width: 0;
}

.trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--background);
  padding: 0 10px 0 12px;
  width: 100%;
  height: 40px;
  color: var(--foreground);
  text-align: left;
}

.current {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron {
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
  width: 16px;
  height: 16px;
}

.menu {
  display: flex;
  position: fixed;
  flex-direction: column;
  z-index: 80;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card);
  padding: 8px;
  max-height: 320px;
}

.search {
  flex: none;
  outline: none;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--background);
  padding: 0 10px;
  width: 100%;
  height: 36px;
  color: var(--foreground);
  font: inherit;
  user-select: text;

  &:focus {
    border-color: var(--primary);
  }
}

.list {
  margin: 6px 0 0;
  padding: 0;
  min-height: 0;
  overflow: auto;
  list-style: none;
}

.option {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  padding: 8px 10px;
  width: 100%;
  color: var(--foreground);
  text-align: left;
}

.option-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option:hover,
.option.active {
  background: color-mix(in srgb, var(--foreground) 8%, transparent);
  color: var(--foreground);
}

.option.picked {
  color: var(--primary);
}

.check {
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
  width: 16px;
  height: 16px;
}

.empty {
  margin: 8px 4px 4px;
  color: var(--muted-foreground);
  font-size: 13px;
}
</style>
