<template>
  <alchemy-panel
    :open="active === 'elements'"
    :minimized="minimized"
    :nested="aboutOpen"
    wide
    @close="shell.close()"
  >
    <template #heading>
      <button
        v-if="aboutOpen"
        class="press icon"
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
      <span class="h6 title">{{ heading }}</span>
    </template>
    <div
      v-show="!aboutOpen"
      class="catalog"
    >
      <div class="filters">
        <div class="search">
          <input
            ref="searchRef"
            v-model="searchInput"
            class="search-input"
            type="text"
            name="search"
            placeholder="Найти"
          >
          <button
            v-if="searchInput"
            class="press icon search-clear"
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
        <div class="category-field">
          <select
            v-model="category"
            class="category"
            aria-label="Тип элемента"
          >
            <option value="">
              Все
            </option>
            <option
              v-for="item in categories"
              :key="item.id"
              :value="item.id"
            >
              {{ item.label }}
            </option>
          </select>
          <svg
            class="category-chevron"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
        <label class="check">
          <input
            v-model="settings.hideEndedElements"
            type="checkbox"
          >
          Скрыть конечные элементы
        </label>
      </div>
      <div
        ref="listRef"
        class="elements-list"
      >
        <p
          v-if="!filteredElements.length"
          class="empty"
        >
          Ничего не найдено
        </p>
        <div
          v-for="element in filteredElements"
          :key="element.id"
          class="element"
          @pointerdown="onPointerDown($event, element)"
          @contextmenu.prevent="openAbout(element)"
        >
          <alchemy-item
            :element="element"
            lazy
          />
        </div>
      </div>
    </div>
    <alchemy-element-about v-if="aboutOpen" />
  </alchemy-panel>
  <Teleport to="body">
    <div
      v-if="ghost"
      class="ghost"
      :style="{ left: `${ghost.x}px`, top: `${ghost.y}px` }"
    >
      <alchemy-item :element="ghost.element" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'

import AlchemyItem from '@/shared/ui/alchemy-item.vue'
import AlchemyPanel from '@/shared/ui/alchemy-panel.vue'
import AlchemyElementAbout from '@/features/about/alchemy-element-about.vue'
import { useGame } from '@/game/injection'
import { recipeById, recipeCategories } from '@/game/recipe'
import type { AlchemyElement } from '@/game/element'

const HOLD_MS = 550
const DRAG_PX = 8

interface Ghost {
  element: AlchemyElement
  x: number
  y: number
  offsetX: number
  offsetY: number
}

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

watch(categories, (items) => {
  if (category.value && !items.some(item => item.id === category.value)) category.value = ''
})
const searchRef = ref<HTMLInputElement>()
const listRef = ref<HTMLElement>()
const ghost = ref<Ghost | null>(null)
let listScroll = 0

function rememberListScroll() {
  if (listRef.value) listScroll = listRef.value.scrollTop
}

function restoreListScroll() {
  nextTick(() => {
    if (listRef.value) listRef.value.scrollTop = listScroll
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

let dragStop: (() => void) | null = null
let holdTimer = 0
let holdOpened = false
let dragMoved = false
let pointerDistance = 0

function stopListeners() {
  window.clearTimeout(holdTimer)
  dragStop?.()
  dragStop = null
}

function finishDrag() {
  stopListeners()
  ghost.value = null
  shell.restoreElements()
}

onUnmounted(stopListeners)

function openAbout(element: AlchemyElement) {
  about.open(element)
}

async function unlockWithVodka() {
  const accepted = await game.session.confirm.ask('ТЫ ЧЕ ПЬЯНЫЙ!?')
  if (!accepted) return
  game.catalog.unlockAll()
}

function onPointerDown(event: PointerEvent, element: AlchemyElement) {
  if (event.button !== 0) return

  const card = event.currentTarget as HTMLElement
  const touch = event.pointerType !== 'mouse'
  const rect = card.getBoundingClientRect()
  const originX = event.clientX
  const originY = event.clientY
  const pointerId = event.pointerId
  const offsetX = originX - rect.left
  const offsetY = originY - rect.top
  let lastY = originY
  stopListeners()
  dragMoved = false
  holdOpened = false
  pointerDistance = 0
  if (touch) {
    try {
      card.setPointerCapture(pointerId)
    } catch {
      // The pointer can already be gone.
    }
  }

  holdTimer = window.setTimeout(() => {
    if (dragMoved) return
    holdOpened = true
    openAbout(element)
  }, HOLD_MS)

  function pointerInside(clientX: number, clientY: number) {
    const bounds = card.closest('.panel')?.getBoundingClientRect()
    return !!bounds
      && clientX >= bounds.left
      && clientX <= bounds.right
      && clientY >= bounds.top
      && clientY <= bounds.bottom
  }

  function onMove(moveEvent: PointerEvent) {
    if (moveEvent.pointerId !== pointerId || holdOpened) return
    const distance = Math.hypot(moveEvent.clientX - originX, moveEvent.clientY - originY)
    pointerDistance = distance
    if (distance >= DRAG_PX) window.clearTimeout(holdTimer)
    const inside = pointerInside(moveEvent.clientX, moveEvent.clientY)
    if (!dragMoved) {
      if (touch && distance >= DRAG_PX && inside && listRef.value) {
        listRef.value.scrollTop -= moveEvent.clientY - lastY
      }
      lastY = moveEvent.clientY
      if (distance < DRAG_PX || inside) return
      dragMoved = true
      shell.minimizeElements()
    }
    if (touch && moveEvent.cancelable) moveEvent.preventDefault()
    ghost.value = {
      element,
      x: moveEvent.clientX - offsetX,
      y: moveEvent.clientY - offsetY,
      offsetX,
      offsetY,
    }
  }

  function onTouchMove(touchEvent: TouchEvent) {
    if (touchEvent.cancelable) touchEvent.preventDefault()
  }

  function onUp(upEvent: PointerEvent) {
    if (upEvent.pointerId !== pointerId) return
    const cancelled = upEvent.type === 'pointercancel'
    const moved = dragMoved
    const held = holdOpened
    const snapshot = ghost.value
    const hit = document.elementFromPoint(upEvent.clientX, upEvent.clientY)
    finishDrag()
    if (cancelled || held || !moved || !snapshot) {
      if (!cancelled && !held && pointerDistance < DRAG_PX) {
        game.board.place(element, undefined, 'create')
        game.audio.play('create')
      }
      return
    }

    if (hit?.closest('.dock')) {
      if (element.id === 'vodka' && hit.closest('#toggle-guide')) void unlockWithVodka()
      return
    }

    game.board.drop(element, {
      x: upEvent.clientX - snapshot.offsetX,
      y: upEvent.clientY - snapshot.offsetY,
    })
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
  if (touch) window.addEventListener('touchmove', onTouchMove, { passive: false })
  dragStop = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    window.removeEventListener('touchmove', onTouchMove)
    try {
      if (card.hasPointerCapture(pointerId)) card.releasePointerCapture(pointerId)
    } catch {
      // The pointer can already be gone.
    }
  }
}
</script>

<style scoped lang="scss">
.icon {
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  width: 36px;
  height: 36px;
}

.icon svg {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
  width: 18px;
  height: 18px;
}

.catalog {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.elements-list {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-content: flex-start;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}

.element {
  transform: translate(0, 0);
  content-visibility: auto;
  cursor: pointer;
  contain-intrinsic-size: auto 140px;
  touch-action: none;
  -webkit-touch-callout: none;
  border-radius: 8px;
}

.element:hover {
  background: color-mix(in srgb, var(--primary) 10%, transparent);
}

.empty {
  padding: 2rem 1rem;
  width: 100%;
  color: var(--muted-foreground);
  text-align: center;
}

.filters {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--border);
  padding: 12px 16px;
}

.search {
  position: relative;
  flex: 1 1 180px;
  min-width: 0;
}

.search-input {
  outline: none;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: transparent;
  padding: 0 40px 0 12px;
  width: 100%;
  height: 40px;
  color: var(--foreground);
  font-size: 16px;
  font-family: inherit;
}

.category-field {
  position: relative;
  flex: none;
  color: var(--foreground);
}

.category {
  appearance: none;
  cursor: pointer;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: transparent;
  padding: 0 36px 0 12px;
  height: 40px;
  color: inherit;
  font: inherit;
}

.category-chevron {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
  width: 16px;
  height: 16px;
  pointer-events: none;
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: var(--foreground);

  input {
    flex: none;
    appearance: none;
    cursor: pointer;
    margin: 0;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: transparent;
    width: 18px;
    height: 18px;

    &:checked {
      box-shadow: inset 0 0 0 3px var(--card);
      border-color: var(--primary);
      background: var(--primary);
    }

    &:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }
  }
}

@media screen and (max-width: 640px) {
  .search {
    flex-basis: 100%;
  }
}

.search-clear {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
}

.ghost {
  position: fixed;
  opacity: 0.9;
  z-index: 60;
  pointer-events: none;
}
</style>
