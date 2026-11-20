<template>
  <div
    ref="root"
    class="combobox"
  >
    <button
      class="press combobox__trigger"
      type="button"
      :aria-label="label ? `${label}: ${currentLabel}` : undefined"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <span class="combobox__current">{{ currentLabel }}</span>
      <svg
        class="combobox__chevron"
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
        class="combobox__menu"
        :style="menuStyle"
      >
        <input
          ref="search"
          v-model="query"
          class="combobox__search"
          type="text"
          placeholder="Поиск"
          @keydown="onKey"
        >
        <p
          v-if="!shown.length"
          class="combobox__empty"
        >
          Ничего не найдено
        </p>
        <ul
          v-else
          class="combobox__list"
          role="listbox"
        >
          <li
            v-for="(option, index) in shown"
            :key="`${option.id}:${index}`"
          >
            <button
              class="press combobox__option"
              type="button"
              role="option"
              :aria-selected="option.id === value"
              :class="{
                'combobox__option--picked': option.id === value,
                'combobox__option--active': index === cursor,
              }"
              @click="choose(option.id)"
            >
              <span class="combobox__label">{{ option.label }}</span>
              <svg
                v-if="option.id === value"
                class="combobox__check"
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
@use '@/styles/mixins' as *;

.combobox {
  width: 100%;
  min-width: 0;

  &__trigger {
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

  &__current {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__chevron {
    flex: none;
    @include icon-stroke(16px);
  }

  &__menu {
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

  &__search {
    flex: none;
    outline: none;
    @include text-field(10px);
    padding: 0 10px;
    width: 100%;
    height: 36px;

    &:focus {
      border-color: var(--primary);
    }
  }

  &__list {
    margin: 6px 0 0;
    padding: 0;
    min-height: 0;
    overflow: auto;
    list-style: none;
  }

  &__option {
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 8px;
    padding: 8px 10px;
    width: 100%;
    color: var(--foreground);
    text-align: left;

    &:hover,
    &--active {
      background: color-mix(in srgb, var(--foreground) 8%, transparent);
      color: var(--foreground);
    }

    &--picked {
      color: var(--primary);
    }
  }

  &__label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__check {
    flex: none;
    @include icon-stroke(16px, 2);
  }

  &__empty {
    margin: 8px 4px 4px;
    color: var(--muted-foreground);
    font-size: 13px;
  }
}
</style>
