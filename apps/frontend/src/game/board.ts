import { computed, nextTick, ref, watch } from 'vue'
import { useElementBounding, useStorage } from '@vueuse/core'
import type { ComputedRef, Ref } from 'vue'

import { matchRecipes } from './recipe'
import { boxesOverlap } from './collision'
import { clusterPositions, offsetPosition, randomPosition } from './position'
import type { AudioApi } from './audio'
import type { CatalogApi } from './catalog'
import type { SettingsApi } from './settings'
import type {
  AlchemyElement,
  AlchemyElementOnBoard,
  BoardBounds,
  ElementBox,
} from './element'

// var(--dock-padding)
const DOCK_GAP = 8

export interface BoardApi {
  boardRef: Ref<HTMLDivElement | undefined>
  dockRef: Ref<HTMLElement | undefined>
  items: Ref<AlchemyElementOnBoard[]>
  boardSize: ComputedRef<BoardBounds>
  elementSize: ComputedRef<ElementBox & { fontSize: string }>
  basics: Ref<AlchemyElementOnBoard[]>
  place: (element: AlchemyElement, position?: AlchemyElementOnBoard['position']) => AlchemyElementOnBoard
  move: (element: AlchemyElementOnBoard, position: AlchemyElementOnBoard['position']) => void
  remove: (element: AlchemyElementOnBoard) => void
  drop: (element: AlchemyElement, position: AlchemyElementOnBoard['position']) => void
  clone: (element: AlchemyElementOnBoard) => void
  clear: () => void
  spawnBasics: (origin: AlchemyElementOnBoard['position']) => void
  combine: (element: AlchemyElementOnBoard) => void
}

export function createBoard(
  settings: SettingsApi,
  audio: AudioApi,
  catalog: CatalogApi,
): BoardApi {
  const boardRef = ref<HTMLDivElement>()
  const dockRef = ref<HTMLElement>()
  const bounds = useElementBounding(boardRef)
  const dockBounds = useElementBounding(dockRef)
  const items = useStorage<AlchemyElementOnBoard[]>('alchemy-board', [])
  const basics = ref<AlchemyElementOnBoard[]>([])

  const boardSize = computed<BoardBounds>(() => {
    const top = bounds.top.value ?? 0
    const left = bounds.left.value ?? 0
    const right = bounds.right.value ?? 0
    const bottom = bounds.bottom.value ?? 0
    const side = settings.values.value.dock || 'bottom'
    const dockReady = dockBounds.width.value > 0 && dockBounds.height.value > 0

    if (!dockReady) {
      return { top, left, right, bottom }
    }

    if (side === 'bottom') {
      return {
        top,
        left,
        right,
        bottom: Math.min(bottom, dockBounds.top.value - DOCK_GAP),
      }
    }

    if (side === 'left') {
      return {
        top,
        left: Math.max(left, dockBounds.right.value + DOCK_GAP),
        right,
        bottom,
      }
    }

    return {
      top,
      left,
      right: Math.min(right, dockBounds.left.value - DOCK_GAP),
      bottom,
    }
  })

  watch(() => settings.values.value.dock, () => {
    nextTick(() => dockBounds.update())
  })

  const elementSize = computed(() => {
    return {
      width: settings.values.value.elementSize,
      height: settings.values.value.elementSize,
      fontSize: `${settings.values.value.elementSize / 2.5}px`,
    }
  })

  function randomPoint() {
    return randomPosition(boardSize.value, settings.values.value.elementSize)
  }

  function remove(element: AlchemyElementOnBoard) {
    const index = items.value.findIndex(item => item.uuid === element.uuid)
    if (index === -1) return
    items.value.splice(index, 1)
  }

  function place(element: AlchemyElement, position = randomPoint()) {
    const next: AlchemyElementOnBoard = {
      ...element,
      uuid: crypto.randomUUID(),
      position,
    }
    items.value.push(next)
    return next
  }

  function combine(element: AlchemyElementOnBoard) {
    for (const other of items.value) {
      if (other.uuid === element.uuid) continue
      if (element.ended || other.ended) continue
      if (!boxesOverlap(element.position, other.position, elementSize.value)) continue

      const results = matchRecipes(element.id, other.id)
      if (!results.length) break

      results.forEach((result, index) => {
        if (result.id === 'freak_games') audio.play('freakGames')
        remove(other)
        remove(element)
        place(result, offsetPosition(other.position, index))
        catalog.add(result)
      })

      break
    }
  }

  function move(element: AlchemyElementOnBoard, position: AlchemyElementOnBoard['position']) {
    element.position = position
    combine(element)
  }

  function drop(element: AlchemyElement, position: AlchemyElementOnBoard['position']) {
    combine(place(element, position))
  }

  function clone(element: AlchemyElementOnBoard) {
    place(element, offsetPosition(element.position, 1))
  }

  function clear() {
    items.value = basics.value.map(element => ({
      ...element,
      position: randomPoint(),
    }))
  }

  function spawnBasics(origin: AlchemyElementOnBoard['position']) {
    const cell = settings.values.value.elementSize * 2
    const spots = clusterPositions(origin, cell, boardSize.value)
    const next = basics.value.map((element, index) => ({
      ...element,
      uuid: crypto.randomUUID(),
      position: spots[index] ?? origin,
    }))
    items.value.push(...next)
  }

  return {
    boardRef,
    dockRef,
    items,
    boardSize,
    elementSize,
    basics,
    place,
    move,
    remove,
    drop,
    clone,
    clear,
    spawnBasics,
    combine,
  }
}
