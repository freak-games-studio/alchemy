<template>
  <div
    v-show="active === 'elements'"
    class="anchor"
    :class="[side, { minimized }]"
  >
    <div class="panel">
      <header
        class="panel-header"
        :class="{ nested: aboutOpen }"
      >
        <div class="heading">
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
        </div>
        <button
          class="press icon"
          type="button"
          aria-label="Закрыть"
          @click="shell.close()"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>
      <div
        v-show="!aboutOpen"
        class="catalog"
      >
        <div
          ref="listRef"
          class="elements-list"
        >
          <p
            v-if="searchInput && !filteredElements.length"
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
        <div class="search">
          <input
            ref="searchRef"
            v-model="searchInput"
            class="search-input"
            type="text"
            name="search"
            placeholder="Поиск элементов"
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
      </div>
      <alchemy-element-about v-if="aboutOpen" />
    </div>
  </div>
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
import AlchemyElementAbout from '@/features/about/alchemy-element-about.vue'
import { useGame } from '@/game/injection'
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
const searchRef = ref<HTMLInputElement>()
const listRef = ref<HTMLElement>()
const ghost = ref<Ghost | null>(null)
const side = computed(() => settings.value.dock || 'bottom')
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

watch([active, aboutOpen, minimized], () => {
  if (active.value !== 'elements' || aboutOpen.value || minimized.value) return
  nextTick(() => searchRef.value?.focus())
})

function clearSearch() {
  searchInput.value = ''
  nextTick(() => searchRef.value?.focus())
}

const heading = computed(() => {
  if (aboutOpen.value && currentElement.value) return currentElement.value.name
  return `Элементы (${counter.value})`
})

const filteredElements = computed(() => {
  const query = searchInput.value.toLowerCase()
  return opened.value.filter((element) => {
    if (settings.value.hideEndedElements && element.ended) return false
    if (!query) return true
    return element.id.includes(query) || element.name.toLowerCase().includes(query)
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
  const rect = card.getBoundingClientRect()
  const originX = event.clientX
  const originY = event.clientY
  const offsetX = originX - rect.left
  const offsetY = originY - rect.top
  stopListeners()
  dragMoved = false
  holdOpened = false
  pointerDistance = 0

  holdTimer = window.setTimeout(() => {
    if (dragMoved) return
    holdOpened = true
    openAbout(element)
  }, HOLD_MS)

  function onMove(moveEvent: PointerEvent) {
    if (holdOpened) return
    const distance = Math.hypot(moveEvent.clientX - originX, moveEvent.clientY - originY)
    pointerDistance = distance
    if (distance >= DRAG_PX) window.clearTimeout(holdTimer)
    if (!dragMoved) {
      if (distance < DRAG_PX) return
      const bounds = card.closest('.panel')?.getBoundingClientRect()
      const inside = !!bounds
        && moveEvent.clientX >= bounds.left
        && moveEvent.clientX <= bounds.right
        && moveEvent.clientY >= bounds.top
        && moveEvent.clientY <= bounds.bottom
      if (inside) return
      dragMoved = true
      shell.minimizeElements()
    }
    ghost.value = {
      element,
      x: moveEvent.clientX - offsetX,
      y: moveEvent.clientY - offsetY,
      offsetX,
      offsetY,
    }
  }

  function onUp(upEvent: PointerEvent) {
    const moved = dragMoved
    const held = holdOpened
    const snapshot = ghost.value
    const hit = document.elementFromPoint(upEvent.clientX, upEvent.clientY)
    finishDrag()
    if (held || !moved || !snapshot) {
      if (!held && pointerDistance < DRAG_PX) game.board.place(element)
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
  dragStop = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
  }
}
</script>

<style scoped lang="scss">
.anchor {
  display: flex;
  position: fixed;
  z-index: 20;
}

.anchor.bottom {
  bottom: calc(90px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
}

.anchor.left {
  top: 50%;
  left: calc(120px + env(safe-area-inset-left));
  transform: translateY(-50%);
}

.anchor.right {
  top: 50%;
  right: calc(120px + env(safe-area-inset-right));
  transform: translateY(-50%);
}

.anchor.minimized {
  pointer-events: none;
}

.panel {
  display: flex;
  flex-direction: column;
  transform-origin: center bottom;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--card);
  width: min(448px, calc(100vw - 108px));
  max-height: min(72dvh, 680px);
  overflow: hidden;
}

.anchor.left .panel {
  transform-origin: left center;
}

.anchor.right .panel {
  transform-origin: right center;
}

.anchor.minimized .panel {
  transform: scale(0.96);
  opacity: 0;
}

.heading {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-header {
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--border);
  padding: 0 12px 0 16px;
  height: 48px;
}

.panel-header.nested {
  padding-left: 8px;
}

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
  padding: 8px 0;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}

.element {
  transform: translate(0, 0);
  content-visibility: auto;
  cursor: pointer;
  contain-intrinsic-size: auto 140px;
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

.search {
  position: relative;
  flex-shrink: 0;
  border-top: 1px solid var(--border);
}

.search-input {
  outline: none;
  border: none;
  background: transparent;
  padding: 1rem 48px;
  width: 100%;
  height: 48px;
  color: var(--foreground);
  font-size: 18px;
  font-family: inherit;
  text-align: center;
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

@media screen and (max-width: 640px) {
  .anchor.bottom {
    right: 8px;
    left: 8px;
    transform: none;
  }

  .anchor.bottom .panel,
  .panel {
    width: min(380px, calc(100vw - 100px));
    max-height: min(58dvh, 560px);
  }

  .anchor.bottom .panel {
    width: 100%;
  }
}
</style>
