import { onUnmounted, ref } from 'vue'
import type { Ref } from 'vue'

import { HOLD_CANCEL_PX, HOLD_MS } from '@/shared/hold'
import type { AlchemyElement } from '@/game/element'

export interface CatalogGhost {
  element: AlchemyElement
  x: number
  y: number
  offsetX: number
  offsetY: number
}

export function useCatalogGesture(actions: {
  minimize: () => void
  restore: () => void
  openMenu: (element: AlchemyElement, x: number, y: number) => void
  place: (element: AlchemyElement) => void
  drop: (element: AlchemyElement, position: { x: number, y: number }) => void
  unlockWithVodka: () => void
}): {
  ghost: Ref<CatalogGhost | null>
  onContextMenu: (event: MouseEvent, element: AlchemyElement) => void
  onPointerDown: (event: PointerEvent, element: AlchemyElement) => void
} {
  const ghost = ref<CatalogGhost | null>(null)
  let dragStop: (() => void) | null = null
  let holdTimer = 0
  let dragMoved = false
  let pointerDistance = 0
  let pointerDown = false
  let gestureTouch = false
  let suppressTouchMenu = false
  let pendingMenu: { element: AlchemyElement, x: number, y: number } | null = null

  function stopListeners() {
    window.clearTimeout(holdTimer)
    dragStop?.()
    dragStop = null
  }

  function finishDrag() {
    stopListeners()
    ghost.value = null
    actions.restore()
  }

  onUnmounted(() => {
    pointerDown = false
    pendingMenu = null
    stopListeners()
  })

  function onContextMenu(event: MouseEvent, element: AlchemyElement) {
    if (event.button !== 2 && pointerDown && gestureTouch) {
      if (dragMoved || pointerDistance >= HOLD_CANCEL_PX) return
      pendingMenu = { element, x: event.clientX, y: event.clientY }
      return
    }
    if (event.button !== 2 && suppressTouchMenu) return
    window.clearTimeout(holdTimer)
    pendingMenu = null
    actions.openMenu(element, event.clientX, event.clientY)
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
    let scrolling = false
    stopListeners()
    dragMoved = false
    pointerDistance = 0
    pointerDown = true
    gestureTouch = touch
    suppressTouchMenu = false
    pendingMenu = null

    holdTimer = window.setTimeout(() => {
      if (dragMoved || scrolling || !touch || pointerDistance >= HOLD_CANCEL_PX) return
      pendingMenu = { element, x: originX, y: originY }
    }, HOLD_MS)

    function pointerInside(clientX: number, clientY: number) {
      const bounds = card.closest('.panel__card')?.getBoundingClientRect()
      return !!bounds
        && clientX >= bounds.left
        && clientX <= bounds.right
        && clientY >= bounds.top
        && clientY <= bounds.bottom
    }

    function claimDrag() {
      if (dragMoved) return
      dragMoved = true
      window.clearTimeout(holdTimer)
      actions.minimize()
      if (!touch) return
      try {
        card.setPointerCapture(pointerId)
      } catch {
        // The pointer can already be gone.
      }
    }

    function gesture(clientX: number, clientY: number) {
      const dx = clientX - originX
      const dy = clientY - originY
      const distance = Math.hypot(dx, dy)
      pointerDistance = distance
      if (distance >= HOLD_CANCEL_PX) {
        window.clearTimeout(holdTimer)
        pendingMenu = null
      }
      if (dragMoved) return 'drag'
      if (!card.isConnected) return 'scroll'
      if (distance < HOLD_CANCEL_PX) return 'wait'
      const inside = pointerInside(clientX, clientY)
      if (!touch) {
        return inside
          ? 'wait'
          : 'drag'
      }
      if (inside && Math.abs(dy) >= Math.abs(dx)) return 'scroll'
      return 'drag'
    }

    function follow(clientX: number, clientY: number) {
      ghost.value = {
        element,
        x: clientX - offsetX,
        y: clientY - offsetY,
        offsetX,
        offsetY,
      }
    }

    function onMove(moveEvent: PointerEvent) {
      if (moveEvent.pointerId !== pointerId || scrolling) return
      const action = gesture(moveEvent.clientX, moveEvent.clientY)
      if (action === 'wait') return
      if (action === 'scroll') {
        scrolling = true
        return
      }
      claimDrag()
      if (touch && moveEvent.cancelable) moveEvent.preventDefault()
      follow(moveEvent.clientX, moveEvent.clientY)
    }

    function touchPoint(touchEvent: TouchEvent) {
      const lists = [touchEvent.touches, touchEvent.changedTouches]
      for (const list of lists) {
        for (let index = 0; index < list.length; index += 1) {
          const point = list.item(index)
          if (point?.identifier === pointerId) return point
        }
      }
    }

    function onTouchMove(touchEvent: TouchEvent) {
      if (scrolling) return
      const point = touchPoint(touchEvent)
      if (!point) return
      const action = gesture(point.clientX, point.clientY)
      if (action === 'wait') return
      if (action === 'scroll') {
        scrolling = true
        return
      }
      claimDrag()
      if (touchEvent.cancelable) touchEvent.preventDefault()
    }

    function onUp(upEvent: PointerEvent) {
      if (upEvent.pointerId !== pointerId) return
      const cancelled = upEvent.type === 'pointercancel'
      const moved = dragMoved
      const scrolled = scrolling
      const snapshot = ghost.value
      const hit = document.elementFromPoint(upEvent.clientX, upEvent.clientY)
      const still = pointerDistance < HOLD_CANCEL_PX
      const menuPoint = !cancelled && !moved && !scrolled && still
        ? pendingMenu
        : null
      pointerDown = false
      suppressTouchMenu = cancelled || moved || scrolled || !still
      pendingMenu = null
      finishDrag()
      if (menuPoint) {
        actions.openMenu(menuPoint.element, menuPoint.x, menuPoint.y)
        return
      }
      if (cancelled || scrolled || !moved || !snapshot) {
        if (!cancelled && !scrolled && still) actions.place(element)
        return
      }

      if (hit?.closest('.dock')) {
        if (element.id === 'vodka' && hit.closest('#toggle-guide')) actions.unlockWithVodka()
        return
      }

      actions.drop(element, {
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

  return {
    ghost,
    onContextMenu,
    onPointerDown,
  }
}
