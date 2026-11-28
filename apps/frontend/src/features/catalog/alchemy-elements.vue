<template>
  <alchemy-panel
    :open="active === 'elements'"
    :side="dock"
    :minimized="minimized"
    :nested="aboutOpen"
    wide
    @close="shell.close()"
  >
    <template #heading>
      <button
        v-if="aboutOpen"
        class="press catalog__back"
        type="button"
        aria-label="Назад"
        @click="about.back()"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M15 6 9 12l6 6" />
        </svg>
      </button>
      <span class="h6">{{ heading }}</span>
    </template>
    <div
      v-show="!aboutOpen"
      class="catalog"
    >
      <div class="catalog__filters">
        <div class="catalog__search">
          <input
            ref="searchRef"
            v-model="searchInput"
            class="catalog__input"
            type="text"
            name="search"
            placeholder="Найти"
          >
          <button
            v-if="searchInput"
            class="press catalog__clear"
            type="button"
            aria-label="Очистить"
            @click="clearSearch"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <alchemy-combobox
          class="catalog__category"
          :value="category"
          :options="categoryOptions"
          label="Тип элемента"
          placeholder="Все"
          @select="category = $event"
        />
        <label
          class="check catalog__ended"
          aria-label="Скрыть конечные элементы"
        >
          <input
            v-model="settings.hideEndedElements"
            class="check__input"
            type="checkbox"
          >
          <span>Скрыть конечные элементы</span>
        </label>
      </div>
      <div
        ref="listRef"
        class="catalog__list"
        @scroll="onListScroll"
      >
        <p
          v-if="!filteredElements.length"
          class="catalog__empty"
        >
          Ничего не найдено
        </p>
        <div
          v-else
          class="catalog__spacer"
          :style="{ height: `${totalHeight}px` }"
        >
          <div
            v-for="row in visibleRows"
            :key="row.key"
            :ref="(element) => measureRow(row.index, element)"
            class="catalog__row"
            :style="{ transform: `translateY(${row.top}px)` }"
          >
            <div
              v-for="element in row.items"
              :key="element.id"
              class="catalog__element"
              @pointerdown="onPointerDown($event, element)"
              @contextmenu.prevent="onContextMenu($event, element)"
            >
              <alchemy-item
                :element="element"
                :size="elementSize"
                lazy
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <alchemy-element-about v-if="aboutOpen" />
  </alchemy-panel>
  <Teleport to="body">
    <div
      v-if="ghost"
      class="catalog__ghost"
      :style="{ left: `${ghost.x}px`, top: `${ghost.y}px` }"
    >
      <alchemy-item
        :element="ghost.element"
        :size="elementSize"
      />
    </div>
  </Teleport>
  <alchemy-context-menu
    v-if="menu"
    :x="menu.x"
    :y="menu.y"
    :items="menuItems"
    @select="onMenuSelect"
    @close="menu = null"
  />
</template>

<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'

import AlchemyItem from '@/shared/ui/alchemy-item.vue'
import AlchemyPanel from '@/shared/ui/alchemy-panel.vue'
import AlchemyCombobox from '@/shared/ui/alchemy-combobox.vue'
import AlchemyContextMenu from '@/shared/ui/alchemy-context-menu.vue'
import AlchemyElementAbout from '@/features/about/alchemy-element-about.vue'
import { useGame } from '@/game/injection'
import { recipeById, recipeCategories } from '@/game/recipe'
import { useCatalogGesture } from './catalog-gesture'
import type { AlchemyElement } from '@/game/element'
import type { ContextMenuItem } from '@/shared/ui/alchemy-context-menu.vue'

const GAP = 8
const OVERSCAN = 3
const LIST_PAD_X = 12
const LIST_PAD_Y = 8

const game = useGame()
const shell = game.session.shell
const about = game.session.about
const active = shell.active
const minimized = shell.elementsMinimized
const aboutOpen = about.isOpen
const currentElement = about.current
const opened = game.catalog.opened
const counter = game.catalog.counter
const settings = game.settings.values
const dock = game.settings.dock
const elementSize = game.board.elementSize
const searchInput = ref('')
const category = ref('')
const categories = computed(() => {
  const openedCategories = new Set<string>()
  for (const element of opened.value) {
    const groups = recipeById(element.id)?.category
    if (!groups) continue
    for (const name of groups) openedCategories.add(name)
  }
  return recipeCategories().filter(item => openedCategories.has(item.id))
})

const categoryOptions = computed(() => {
  return [
    { id: '', label: 'Все' },
    ...categories.value.map(item => ({
      id: item.id,
      label: item.label,
    })),
  ]
})

watch(categories, (items) => {
  if (category.value && !items.some(item => item.id === category.value)) category.value = ''
})
const searchRef = ref<HTMLInputElement>()
const listRef = ref<HTMLElement>()
const menu = ref<{ element: AlchemyElement, x: number, y: number } | null>(null)
const menuItems: ContextMenuItem[] = [
  { id: 'add', label: 'Добавить элемент' },
  { id: 'about', label: 'Информация об элементе' },
]
const scrollTop = ref(0)
const listWidth = ref(0)
const listHeight = ref(0)
const rowHeights = ref<number[]>([])
const measuredList = useElementSize(listRef, { width: 0, height: 0 }, { box: 'content-box' })
let listScroll = 0

watch(measuredList.width, (value) => {
  if (value > 0) listWidth.value = value
})

watch(measuredList.height, (value) => {
  if (value > 0) listHeight.value = value
})

function onListScroll(event: Event) {
  scrollTop.value = (event.target as HTMLElement).scrollTop
}

function rememberListScroll() {
  if (listRef.value) listScroll = listRef.value.scrollTop
}

function restoreListScroll() {
  nextTick(() => {
    if (!listRef.value) return
    listRef.value.scrollTop = listScroll
    scrollTop.value = listRef.value.scrollTop
  })
}

watch(aboutOpen, (open) => {
  if (open) rememberListScroll()
  else restoreListScroll()
})

watch(active, (panel, prev) => {
  if (prev === 'elements' && panel !== 'elements') rememberListScroll()
  else if (panel === 'elements') restoreListScroll()
})

function clearSearch() {
  searchInput.value = ''
  nextTick(() => searchRef.value?.focus())
}

const heading = computed(() => {
  if (aboutOpen.value && currentElement.value) return currentElement.value.name
  return `Элементы (${counter.value})`
})

function listedElement(stored: AlchemyElement): AlchemyElement {
  const recipe = recipeById(stored.id)
  const element: AlchemyElement = {
    id: stored.id,
    name: recipe?.name ?? stored.name,
  }
  if (recipe ? recipe.ended : stored.ended) element.ended = true
  return element
}

const filteredElements = computed(() => {
  const query = searchInput.value.toLowerCase()
  return opened.value.flatMap((stored) => {
    const element = listedElement(stored)
    if (settings.value.hideEndedElements && element.ended) return []
    if (category.value && !recipeById(stored.id)?.category?.includes(category.value)) return []
    if (query && !element.id.includes(query) && !element.name.toLowerCase().includes(query)) return []
    return [element]
  })
})

const itemWidth = computed(() => game.board.elementSize.value.width * 2)
const rowEstimate = computed(() => game.board.elementSize.value.height * 2)
const columns = computed(() => {
  const available = listWidth.value - LIST_PAD_X * 2
  if (available <= 0) return 0
  return Math.max(1, Math.floor((available + GAP) / (itemWidth.value + GAP)))
})

const elementRows = computed(() => {
  const count = columns.value
  const source = filteredElements.value
  if (count <= 0) return []
  const next: AlchemyElement[][] = []
  for (let index = 0; index < source.length; index += count) next.push(source.slice(index, index + count))
  return next
})

watch([columns, itemWidth, filteredElements], () => {
  rowHeights.value = []
})

const rowOffsets = computed(() => {
  const estimate = rowEstimate.value
  const offsets = [LIST_PAD_Y]
  for (let index = 0; index < elementRows.value.length; index += 1) {
    const height = rowHeights.value[index] || estimate
    const gap = index === elementRows.value.length - 1
      ? 0
      : GAP
    offsets.push(offsets[index] + height + gap)
  }
  return offsets
})

const totalHeight = computed(() => {
  const offsets = rowOffsets.value
  return offsets[offsets.length - 1] + LIST_PAD_Y
})

const visibleRows = computed(() => {
  const offsets = rowOffsets.value
  const count = elementRows.value.length
  if (!count) return []
  const viewTop = scrollTop.value
  const viewBottom = scrollTop.value + Math.max(listHeight.value, 1)
  let start = 0
  while (start < count && offsets[start + 1] < viewTop) start += 1
  let end = start
  while (end < count && offsets[end] < viewBottom) end += 1
  start = Math.max(0, start - OVERSCAN)
  end = Math.min(count, end + OVERSCAN)
  const visible = []
  for (let index = start; index < end; index += 1) {
    const items = elementRows.value[index]
    if (!items?.[0]) continue
    visible.push({
      index,
      key: items[0].id,
      top: offsets[index] ?? LIST_PAD_Y,
      items,
    })
  }
  return visible
})

const rowObservers = new Map<number, { element: HTMLElement, disconnect: () => void }>()
const pendingHeights = new Map<number, number>()
let heightFrame = 0

function queueRowHeight(index: number, height: number) {
  if (height <= 0 || rowHeights.value[index] === height) return
  pendingHeights.set(index, height)
  if (heightFrame) return
  heightFrame = requestAnimationFrame(() => {
    heightFrame = 0
    if (!pendingHeights.size) return
    const next = rowHeights.value.slice()
    for (const [rowIndex, rowHeight] of pendingHeights) next[rowIndex] = rowHeight
    pendingHeights.clear()
    rowHeights.value = next
  })
}

function measureRow(index: number, element: Element | ComponentPublicInstance | null) {
  const current = rowObservers.get(index)
  if (!(element instanceof HTMLElement)) {
    current?.disconnect()
    rowObservers.delete(index)
    return
  }
  if (current?.element === element) return
  current?.disconnect()
  const observer = new ResizeObserver(() => {
    queueRowHeight(index, element.offsetHeight)
  })
  observer.observe(element)
  rowObservers.set(index, {
    element,
    disconnect: () => observer.disconnect(),
  })
}

function openMenu(element: AlchemyElement, x: number, y: number) {
  menu.value = { element, x, y }
}

function onMenuSelect(id: string) {
  const current = menu.value
  if (!current) return
  if (id === 'add') {
    game.board.place(current.element, undefined, 'create')
    game.audio.play('create')
    return
  }
  about.open(current.element)
}

async function unlockWithVodka() {
  const accepted = await game.session.confirm.ask('ТЫ ЧЕ ПЬЯНЫЙ!?')
  if (!accepted) return
  game.catalog.unlockAll()
}

const { ghost, onContextMenu, onPointerDown } = useCatalogGesture({
  minimize: () => shell.minimizeElements(),
  restore: () => shell.restoreElements(),
  openMenu,
  place: (element) => {
    game.board.place(element, undefined, 'create')
    game.audio.play('create')
  },
  drop: (element, position) => game.board.drop(element, position),
  unlockWithVodka,
})

onUnmounted(() => {
  if (heightFrame) cancelAnimationFrame(heightFrame)
  for (const observer of rowObservers.values()) observer.disconnect()
  rowObservers.clear()
})
</script>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.catalog {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;

  &__back,
  &__clear {
    @include icon-button;
  }

  &__filters {
    display: flex;
    flex-shrink: 0;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid var(--border);
    padding: 12px 16px;
  }

  &__search {
    position: relative;
    flex: 1 1 180px;
    min-width: 0;
  }

  &__input {
    @include text-field;
    padding: 0 40px 0 12px;
    width: 100%;
    height: 40px;
  }

  &__clear {
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
  }

  &__category {
    flex: none;
    width: 180px;
    color: var(--foreground);
  }

  &__ended::after {
    margin-left: -6px;
    content: '*';
    color: var(--primary);
  }

  &__list {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: auto;
    overflow-anchor: none;
    overscroll-behavior: contain;
    touch-action: pan-y;
  }

  &__spacer {
    position: relative;
    width: 100%;
  }

  &__row {
    display: flex;
    position: absolute;
    right: 12px;
    left: 12px;
    justify-content: center;
    align-items: center;
    gap: 8px;
  }

  &__element {
    flex: none;
    cursor: pointer;
    touch-action: pan-y;
    -webkit-touch-callout: none;
    border-radius: 8px;

    &:hover {
      background: color-mix(in srgb, var(--primary) 10%, transparent);
    }
  }

  &__empty {
    padding: 2rem 1rem;
    width: 100%;
    color: var(--muted-foreground);
    text-align: center;
  }

  &__ghost {
    position: fixed;
    opacity: 0.9;
    z-index: 60;
    pointer-events: none;
  }

  @media screen and (max-width: 640px) {
    &__filters {
      flex-wrap: nowrap;
      padding: 8px 12px;
    }

    &__search {
      flex: 1 1 auto;
    }

    &__input {
      height: 36px;
    }

    &__category {
      flex: 0 1 112px;
      width: auto;

      :deep(.combobox__trigger) {
        height: 36px;
      }
    }

    &__ended {
      position: relative;

      span {
        position: absolute;
        overflow: hidden;
        clip: rect(0 0 0 0);
        width: 1px;
        height: 1px;
      }

      &::after {
        margin-left: 0;
      }
    }
  }
}
</style>
