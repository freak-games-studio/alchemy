<template>
  <div
    ref="element"
    class="alchemy-item"
    :class="{ settling }"
    :style="itemStyle"
    @dblclick="$emit('clone-element', alchemyElement)"
    @contextmenu.prevent="$emit('remove-element', alchemyElement)"
    @pointerdown="onHoldStart"
    @pointermove="onHoldMove"
    @pointerup="onHoldEnd"
    @pointercancel="onHoldEnd"
  >
    <div
      class="show"
      :class="{ born: !!birth }"
    >
      <alchemy-item :element="alchemyElement" />
      <span
        v-if="birth === 'discover'"
        class="wow"
        aria-hidden="true"
      >
        <svg
          class="wow-shape"
          viewBox="0 0 100 100"
        >
          <polygon
            :points="burstPoints"
            fill="#ffe14a"
            stroke="#e23b2f"
            stroke-width="2.5"
            stroke-linejoin="round"
          />
          <circle
            cx="50"
            cy="50"
            r="14"
            fill="#fff"
          />
        </svg>
      </span>
    </div>
    <span
      v-if="birth"
      class="smoke"
      aria-hidden="true"
    >
      <span
        v-for="puff in puffs"
        :key="puff.index"
        class="puff"
        :style="puff.style"
      >
        <span class="puff-dot" />
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { clamp, useDraggable } from '@vueuse/core'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

import AlchemyItem from '@/shared/ui/alchemy-item.vue'
import { useGame } from '@/game/injection'
import type { AlchemyElementOnBoard, Position } from '@/game/element'

const props = defineProps<{
  alchemyElement: AlchemyElementOnBoard
}>()

const emit = defineEmits<{
  (event: 'position', value: Position): void
  (event: 'clone-element', value: AlchemyElementOnBoard): void
  (event: 'remove-element', value: AlchemyElementOnBoard): void
}>()

const HOLD_MS = 550
const HOLD_CANCEL_PX = 8

const game = useGame()
const boardSize = game.board.boardSize
const settling = game.board.settling
const birth = computed(() => {
  const uuid = props.alchemyElement.uuid
  if (!uuid) return
  return game.board.births.value[uuid]
})
const imageWidth = computed(() => `${game.board.elementSize.value.width}px`)
const imageHeight = computed(() => `${game.board.elementSize.value.height}px`)
const spriteX = ref('50%')
const spriteY = ref('40%')
const smokeX = ref('50%')
const smokeY = ref('40%')
const burstPoints = Array.from({ length: 16 }, (_, index) => {
  const radius = index % 2 === 0
    ? 46
    : 28
  const angle = -Math.PI / 2 + (index * Math.PI) / 8
  const x = (50 + Math.cos(angle) * radius).toFixed(1)
  const y = (50 + Math.sin(angle) * radius).toFixed(1)
  return `${x},${y}`
}).join(' ')
const puffs = computed(() => {
  if (!birth.value) return []
  return Array.from({ length: 12 }, (_, index) => {
    const spread = unit(index, 1)
    const swirl = (index % 2 === 0
      ? 1
      : -1) * (28 + spread * 22)
    return {
      index,
      style: {
        '--puff-angle': `${45 + index * 30}deg`,
        '--puff-swirl': `${swirl}deg`,
        '--puff-size': `${2 + unit(index, 2) * 14}px`,
        '--puff-duration': `${400 + unit(index, 3) * 400}ms`,
        '--puff-delay': `${unit(index, 4) * 75}ms`,
      },
    }
  })
})

function unit(index: number, salt: number) {
  const n = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453
  return n - Math.floor(n)
}
const element = ref<HTMLElement | null>(null)
const box = ref({ width: 0, height: 0 })
let holdTimer = 0
let holdOrigin = { x: 0, y: 0 }
let removedByHold = false

function cancelHold() {
  window.clearTimeout(holdTimer)
  holdTimer = 0
}

function onHoldStart(event: PointerEvent) {
  if (event.button !== 0) return
  removedByHold = false
  holdOrigin = { x: event.clientX, y: event.clientY }
  cancelHold()
  holdTimer = window.setTimeout(() => {
    removedByHold = true
    emit('remove-element', props.alchemyElement)
  }, HOLD_MS)
}

function onHoldMove(event: PointerEvent) {
  if (!holdTimer) return
  const distance = Math.hypot(event.clientX - holdOrigin.x, event.clientY - holdOrigin.y)
  if (distance > HOLD_CANCEL_PX) cancelHold()
}

function onHoldEnd() {
  cancelHold()
}

onUnmounted(cancelHold)

function measure() {
  const node = element.value
  if (!node) return
  box.value = {
    width: node.offsetWidth,
    height: node.offsetHeight,
  }
  const image = node.querySelector('img')
  const show = node.querySelector<HTMLElement>('.show')
  if (!image || !show) return
  const x = image.offsetLeft + image.offsetWidth / 2
  const y = image.offsetTop + image.offsetHeight / 2
  spriteX.value = `${x}px`
  spriteY.value = `${y}px`
  smokeX.value = `${show.offsetLeft + x}px`
  smokeY.value = `${show.offsetTop + y}px`
}

onMounted(measure)
watch(() => game.board.elementSize.value.width, () => nextTick(measure))

const { position } = useDraggable(element, {
  initialValue: props.alchemyElement.position,
  onStart() {
    game.audio.play('taking')
  },
  onEnd() {
    if (removedByHold) return
    // eslint-disable-next-line ts/no-use-before-define
    emit('position', { x: xPosition.value, y: yPosition.value })
  },
})

const xPosition = computed(() => {
  return clamp(
    boardSize.value.left,
    position.value.x,
    boardSize.value.right - box.value.width,
  )
})

const yPosition = computed(() => {
  return clamp(
    boardSize.value.top,
    position.value.y,
    boardSize.value.bottom - box.value.height,
  )
})

watch(() => props.alchemyElement.position, () => {
  position.value = props.alchemyElement.position
})

const itemStyle = computed(() => ({
  'left': `${xPosition.value}px`,
  'top': `${yPosition.value}px`,
  '--sprite-x': spriteX.value,
  '--sprite-y': spriteY.value,
  '--smoke-x': smokeX.value,
  '--smoke-y': smokeY.value,
}))
</script>

<style scoped lang="scss">
.alchemy-item {
  position: fixed;
  z-index: 1;
  cursor: pointer;
  isolation: isolate;
  inline-size: min-content;
  touch-action: none;
  overflow-wrap: break-word;
}

.alchemy-item:active,
.alchemy-item:hover {
  z-index: 2;
  transition: none;
}

.alchemy-item.settling,
.alchemy-item.settling:hover {
  transition:
    left 450ms cubic-bezier(0.22, 1, 0.36, 1),
    top 450ms cubic-bezier(0.22, 1, 0.36, 1);
}

.alchemy-item.settling:active {
  transition: none;
}

.show {
  position: relative;
}

.show.born {
  transform-origin: var(--sprite-x) var(--sprite-y);
  animation: alchemy-show 300ms ease forwards;
}

.wow {
  position: absolute;
  top: var(--sprite-y);
  left: var(--sprite-x);
  transform: translate(-50%, -50%);
  z-index: 3;
  width: v-bind(imageWidth);
  height: v-bind(imageHeight);
  pointer-events: none;
}

.wow-shape {
  display: block;
  animation: alchemy-wow 300ms linear forwards;
  width: 100%;
  height: 100%;
}

.smoke {
  position: absolute;
  top: var(--smoke-y);
  left: var(--smoke-x);
  z-index: 2;
  filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.45));
  width: 0;
  height: 0;
  pointer-events: none;
}

.puff {
  position: absolute;
  top: 0;
  left: 0;
  animation: alchemy-swirl var(--puff-duration) cubic-bezier(0.22, 1, 0.36, 1) var(--puff-delay) forwards;
  width: 0;
  height: 0;
}

.puff-dot {
  position: absolute;
  animation: alchemy-puff-scale var(--puff-duration) cubic-bezier(0.55, 0.085, 0.68, 0.53) var(--puff-delay) forwards;
  border-radius: 50%;
  background: #fff;
  width: var(--puff-size);
  height: var(--puff-size);
}

@keyframes alchemy-show {
  from {
    transform: scale(0.1);
  }

  to {
    transform: scale(1);
  }
}

@keyframes alchemy-swirl {
  from {
    transform: rotate(var(--puff-angle)) translateX(14px);
  }

  to {
    transform: rotate(calc(var(--puff-angle) + var(--puff-swirl))) translateX(62px);
  }
}

@keyframes alchemy-puff-scale {
  from {
    transform: translate(-50%, -50%) scale(1);
  }

  to {
    transform: translate(-50%, -50%) scale(0);
  }
}

@keyframes alchemy-wow {
  0% {
    transform: scale(0.3) rotate(0deg);
    opacity: 1;
  }

  99% {
    transform: scale(1.45) rotate(360deg);
    opacity: 1;
  }

  100% {
    transform: scale(1.45) rotate(360deg);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .show.born,
  .wow-shape,
  .puff,
  .puff-dot {
    animation: none;
  }

  .smoke,
  .wow {
    display: none;
  }
}
</style>
