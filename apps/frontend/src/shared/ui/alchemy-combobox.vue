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
      <img
        v-if="currentImage"
        :key="currentImage"
        class="combobox__image"
        :src="currentImage"
        alt=""
        @error="hideImage"
      >
      <span
        class="combobox__current"
        :class="{ 'combobox__current--ended': currentEnded }"
      >{{ currentLabel }}</span>
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
          v-if="!matched.length"
          class="combobox__empty"
        >
          Ничего не найдено
        </p>
        <ul
          v-else
          ref="list"
          class="combobox__list"
          role="listbox"
          @scroll="onListScroll"
        >
          <li
            class="combobox__window"
            :style="{ height: `${matched.length * ROW}px` }"
          >
            <button
              v-for="item in visible"
              :key="item.option.id"
              class="press combobox__option"
              type="button"
              role="option"
              :aria-selected="item.option.id === value"
              :class="{
                'combobox__option--picked': item.option.id === value,
                'combobox__option--active': item.index === cursor,
              }"
              :style="{ transform: `translateY(${item.offset}px)` }"
              @click="choose(item.option.id)"
            >
              <img
                v-if="item.option.image"
                :key="item.option.image"
                class="combobox__image"
                :src="item.option.image"
                alt=""
                @error="hideImage"
              >
              <span
                class="combobox__label"
                :class="{ 'combobox__label--ended': item.option.ended }"
              >{{ item.option.label }}</span>
              <svg
                v-if="item.option.id === value"
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
  image?: string
  ended?: boolean
}

const props = defineProps<{
  value: string
  options: ComboboxOption[]
  placeholder?: string
  label?: string
  span?: string
  autofocus?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const ROW = 40
const OVERSCAN = 4

const root = ref<HTMLElement>()
const menu = ref<HTMLElement>()
const search = ref<HTMLInputElement>()
const list = ref<HTMLElement>()
const open = ref(false)
const query = ref('')
const cursor = ref(0)
const scrollTop = ref(0)
const listHeight = ref(240)
const menuStyle = ref({ top: '0px', left: '0px', width: '0px' })

const current = computed(() => props.options.find(option => option.id === props.value))

const currentLabel = computed(() => current.value?.label || props.placeholder || '')

const currentImage = computed(() => current.value?.image)
const currentEnded = computed(() => Boolean(current.value?.ended))

const matched = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return props.options
  return props.options.filter((option) => {
    return option.label.toLowerCase().includes(needle) || option.id.toLowerCase().includes(needle)
  })
})

const visible = computed(() => {
  const items = matched.value
  const height = listHeight.value || ROW
  const start = Math.max(0, Math.floor(scrollTop.value / ROW) - OVERSCAN)
  const end = Math.min(items.length, Math.ceil((scrollTop.value + height) / ROW) + OVERSCAN)
  const next = []
  for (let index = start; index < end; index += 1) {
    const option = items[index]
    if (!option) continue
    next.push({
      option,
      index,
      offset: index * ROW,
    })
  }
  return next
})

watch(query, () => {
  cursor.value = 0
  scrollTop.value = 0
  if (list.value) list.value.scrollTop = 0
  if (open.value) nextTick(place)
})

useEventListener('pointerdown', onPointerDown)
useEventListener(window, 'resize', place)
useEventListener(window, 'scroll', place, true)

function toggle() {
  open.value = !open.value
  if (!open.value) return
  query.value = ''
  nextTick(() => {
    cursor.value = Math.max(0, matched.value.findIndex(option => option.id === props.value))
    place()
    if (list.value) listHeight.value = list.value.clientHeight
    reveal(cursor.value)
    if (props.autofocus) search.value?.focus()
  })
}

function place() {
  if (!open.value) return
  const trigger = root.value?.getBoundingClientRect()
  const popup = menu.value
  if (!trigger || !popup) return
  const frame = props.span
    ? root.value?.closest(props.span)?.getBoundingClientRect()
    : undefined
  const gap = 6
  let width = Math.max(trigger.width, 220)
  if (frame) width = frame.width
  const menuHeight = popup.offsetHeight
  const spaceBelow = window.innerHeight - trigger.bottom - gap
  const spaceAbove = trigger.top - gap
  let top = trigger.bottom + gap
  if (spaceBelow < menuHeight && spaceAbove > spaceBelow) top = trigger.top - menuHeight - gap
  top = Math.max(gap, Math.min(top, window.innerHeight - menuHeight - gap))
  const origin = frame?.left ?? trigger.left
  const left = Math.max(gap, Math.min(origin, window.innerWidth - width - gap))
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

function onListScroll(event: Event) {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  scrollTop.value = target.scrollTop
  listHeight.value = target.clientHeight
}

function reveal(index: number) {
  const pane = list.value
  if (!pane) return
  const top = index * ROW
  const bottom = top + ROW
  if (top < pane.scrollTop) pane.scrollTop = top
  else if (bottom > pane.scrollTop + pane.clientHeight) pane.scrollTop = bottom - pane.clientHeight
  scrollTop.value = pane.scrollTop
  listHeight.value = pane.clientHeight
}

function hideImage(event: Event) {
  const image = event.target
  if (image instanceof HTMLImageElement) image.style.visibility = 'hidden'
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
  const count = matched.value.length
  if (!count) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    cursor.value = Math.min(count - 1, cursor.value + 1)
    reveal(cursor.value)
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    cursor.value = Math.max(0, cursor.value - 1)
    reveal(cursor.value)
    return
  }
  if (event.key !== 'Enter') return
  event.preventDefault()
  const option = matched.value[cursor.value]
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

    &--ended::after {
      content: '*';
      color: var(--primary);
    }
  }

  &__image {
    flex: none;
    width: 24px;
    height: 24px;
    object-fit: contain;
    pointer-events: none;
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
    max-height: 240px;
    overflow: auto;
    list-style: none;
  }

  &__window {
    position: relative;
  }

  &__option {
    display: flex;
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    align-items: center;
    gap: 8px;
    box-sizing: border-box;
    border-radius: 8px;
    padding: 0 10px;
    width: 100%;
    height: 40px;
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

    &--ended::after {
      margin-left: 6px;
      content: '*';
      color: var(--primary);
    }
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
