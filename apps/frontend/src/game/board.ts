import { computed, nextTick, ref, watch } from 'vue'
import { useElementBounding, useStorage } from '@vueuse/core'
import type { ComputedRef, Ref } from 'vue'

import { uniqueId } from './id'
import { matchRecipes } from './recipe'
import { boxesOverlap } from './collision'
import { gridPositions, offsetPosition, randomPosition } from './position'
import type { AudioApi } from './audio'
import type { ToastApi } from './toast'
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
// .draggable--settling transition is 450ms
const SETTLE_MS = 480

export type ElementBirth = 'create' | 'discover'

export interface BoardApi {
  boardRef: Ref<HTMLDivElement | undefined>
  dockRef: Ref<HTMLElement | undefined>
  items: Ref<AlchemyElementOnBoard[]>
  boardSize: ComputedRef<BoardBounds>
  elementSize: ComputedRef<ElementBox & { fontSize: string }>
  basics: Ref<AlchemyElementOnBoard[]>
  births: Ref<Record<string, ElementBirth>>
  place: (
    element: AlchemyElement,
    position?: AlchemyElementOnBoard['position'],
    birth?: ElementBirth,
  ) => AlchemyElementOnBoard
  move: (element: AlchemyElementOnBoard, position: AlchemyElementOnBoard['position']) => void
  remove: (element: AlchemyElementOnBoard) => void
  drop: (element: AlchemyElement, position: AlchemyElementOnBoard['position']) => void
  clone: (element: AlchemyElementOnBoard) => void
  clear: () => void
  arrange: () => void
  settling: Ref<boolean>
  spawnBasics: () => void
  combine: (element: AlchemyElementOnBoard) => void
}

export function createBoard(
  settings: SettingsApi,
  audio: AudioApi,
  services: {
    catalog: CatalogApi
    toast: ToastApi
  },
): BoardApi {
  const { catalog, toast } = services
  const boardRef = ref<HTMLDivElement>()
  const dockRef = ref<HTMLElement>()
  const bounds = useElementBounding(boardRef)
  const dockBounds = useElementBounding(dockRef)
  const items = useStorage<AlchemyElementOnBoard[]>('alchemy-board', [])
  const basics = ref<AlchemyElementOnBoard[]>([])
  const births = ref<Record<string, ElementBirth>>({})
  const settling = ref(false)
  let settleTimer = 0
  let settleToken = 0

  const boardSize = computed<BoardBounds>(() => {
    const top = bounds.top.value ?? 0
    const left = bounds.left.value ?? 0
    const right = bounds.right.value ?? 0
    const bottom = bounds.bottom.value ?? 0
    const side = settings.dock.value
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

  watch(settings.dock, () => {
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

  function markBirth(uuid: string | undefined, birth: ElementBirth) {
    if (!uuid) return
    births.value = { ...births.value, [uuid]: birth }
  }

  function forgetBirth(uuid: string | undefined) {
    if (!uuid || !(uuid in births.value)) return
    const next = { ...births.value }
    delete next[uuid]
    births.value = next
  }

  function remove(element: AlchemyElementOnBoard) {
    const index = items.value.findIndex(item => item.uuid === element.uuid)
    if (index === -1) return
    items.value.splice(index, 1)
    forgetBirth(element.uuid)
  }

  function place(
    element: AlchemyElement,
    position = randomPoint(),
    birth?: ElementBirth,
  ) {
    const next: AlchemyElementOnBoard = {
      ...element,
      uuid: uniqueId(),
      position,
    }
    items.value.push(next)
    if (birth) markBirth(next.uuid, birth)
    return next
  }

  function combine(element: AlchemyElementOnBoard) {
    for (const other of items.value) {
      if (other.uuid === element.uuid) continue
      if (element.ended || other.ended) continue
      if (!boxesOverlap(element.position, other.position, elementSize.value)) continue

      const results = matchRecipes(element.id, other.id)
      if (!results.length) break

      let slot = 0
      for (const match of results) {
        if (match.element.id === 'freak_games') audio.play('freakGames')
        remove(other)
        remove(element)
        const spawned = [
          place(match.element, offsetPosition(other.position, slot)),
        ]
        slot += 1
        if (match.propagate) {
          spawned.push(place(match.element, offsetPosition(other.position, slot)))
          slot += 1
        }
        const discovered = catalog.add(match.element)
        const birth: ElementBirth = discovered ? 'discover' : 'create'
        for (const item of spawned) markBirth(item.uuid, birth)
        if (discovered) {
          toast.show(`Новый элемент: ${element.name} + ${other.name} = ${match.element.name}`)
        }
      }

      return true
    }

    return false
  }

  function move(element: AlchemyElementOnBoard, position: AlchemyElementOnBoard['position']) {
    element.position = position
    combine(element)
  }

  function drop(element: AlchemyElement, position: AlchemyElementOnBoard['position']) {
    const placed = place(element, position)
    if (combine(placed)) return
    audio.play('create')
    markBirth(placed.uuid, 'create')
  }

  function clone(element: AlchemyElementOnBoard) {
    place(element, offsetPosition(element.position, 1), 'create')
  }

  function clear() {
    births.value = {}
    items.value = basics.value.map(element => ({
      ...element,
      position: randomPoint(),
    }))
  }

  function cellSize() {
    const fallback = settings.values.value.elementSize * 2
    const nodes = boardRef.value?.querySelectorAll<HTMLElement>('.draggable')
    let width = fallback
    let height = fallback
    nodes?.forEach((node) => {
      width = Math.max(width, node.offsetWidth)
      height = Math.max(height, node.offsetHeight)
    })
    return { width, height }
  }

  function applyGrid() {
    const sorted = [...items.value].sort((a, b) => {
      const dy = a.position.y - b.position.y
      if (dy !== 0) return dy
      return a.position.x - b.position.x
    })
    const spots = gridPositions(sorted.length, boardSize.value, cellSize())
    sorted.forEach((item, index) => {
      const spot = spots[index]
      if (!spot) return
      item.position = { x: spot.x, y: spot.y }
    })
  }

  function arrange() {
    if (!items.value.length) return
    const token = ++settleToken
    window.clearTimeout(settleTimer)
    settling.value = true
    nextTick(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (token !== settleToken) return
          if (!items.value.length) {
            settling.value = false
            return
          }
          applyGrid()
          settleTimer = window.setTimeout(() => {
            if (token !== settleToken) return
            settling.value = false
          }, SETTLE_MS)
        })
      })
    })
  }

  function spawnBasics() {
    const next = basics.value.map(element => ({
      ...element,
      uuid: uniqueId(),
      position: randomPoint(),
    }))
    if (!next.length) return
    items.value.push(...next)
    for (const element of next) markBirth(element.uuid, 'create')
    audio.play('create')
  }

  return {
    boardRef,
    dockRef,
    items,
    boardSize,
    elementSize,
    basics,
    births,
    place,
    move,
    remove,
    drop,
    clone,
    clear,
    arrange,
    settling,
    spawnBasics,
    combine,
  }
}
