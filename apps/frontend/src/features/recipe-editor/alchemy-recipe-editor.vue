<template>
  <div class="editor">
    <header class="toolbar">
      <div class="search">
        <input
          v-model="query"
          class="search-input"
          type="text"
          placeholder="Найти элемент"
          @keydown.enter.prevent="focusFirst"
          @keydown.esc="query = ''"
        >
        <ul
          v-if="matches.length"
          class="matches"
        >
          <li
            v-for="match in matches"
            :key="match.id"
          >
            <button
              class="press match"
              type="button"
              @click="focusMatch(match.id)"
            >
              <span>{{ match.name }}</span>
              <span class="match-id">{{ match.id }}</span>
            </button>
          </li>
        </ul>
      </div>
      <div class="controls">
        <button
          class="press"
          type="button"
          aria-label="К началу"
          title="К началу"
          :disabled="editor.centerId === null"
          @click="goHome"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
            <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
        </button>
        <button
          class="press"
          type="button"
          aria-label="Назад"
          title="Назад"
          :disabled="!editor.canGoBack"
          @click="goBack"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
        </button>
        <button
          class="press"
          type="button"
          aria-label="Вперёд"
          title="Вперёд"
          :disabled="!editor.canGoForward"
          @click="goForward"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
        <span class="split" />
        <button
          class="press"
          type="button"
          aria-label="Создать элемент"
          title="Создать элемент"
          @click="createElement"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        </button>
        <button
          class="press"
          type="button"
          aria-label="Выход"
          title="Выход"
          @click="closeEditor"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
        <button
          class="press safe"
          type="button"
          :aria-label="editor.saving ? 'Сохранение' : 'Сохранить'"
          :title="editor.saving ? 'Сохранение' : 'Сохранить'"
          :disabled="!editor.dirty || editor.saving"
          @click="editor.save()"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
            <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
            <path d="M7 3v4a1 1 0 0 0 1 1h7" />
          </svg>
        </button>
      </div>
      <p
        v-if="editor.error"
        class="error"
        :title="editor.error"
      >
        {{ editor.error }}
      </p>
    </header>
    <div class="workspace">
      <div class="canvas">
        <vue-flow
          v-model:nodes="editor.nodes"
          v-model:edges="editor.edges"
          :elements-selectable="false"
          :min-zoom="0.02"
          :max-zoom="1.75"
          :connection-radius="28"
          :connection-mode="ConnectionMode.Strict"
          :delete-key-code="null"
          :edges-updatable="false"
          :is-valid-connection="editor.canConnect"
          @node-click="onNodeClick"
          @edge-click="onEdgeClick"
          @pane-click="editor.clearSelection()"
          @connect="onConnect"
        >
          <template #node-element="nodeProps">
            <recipe-element-node v-bind="nodeProps" />
          </template>
          <template #node-plus>
            <div class="join">
              +
            </div>
          </template>
          <background
            :gap="24"
            pattern-color="var(--border)"
          />
          <controls position="bottom-left" />
        </vue-flow>
      </div>
      <recipe-inspector />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Controls } from '@vue-flow/controls'
import { useEventListener } from '@vueuse/core'
import { Background } from '@vue-flow/background'
import { computed, nextTick, onMounted, provide, ref } from 'vue'
import { ConnectionMode, useVueFlow, VueFlow } from '@vue-flow/core'
import type { Connection, Node } from '@vue-flow/core'

import RecipeInspector from './recipe-inspector.vue'
import RecipeElementNode from './recipe-element-node.vue'
import { useGame } from '@/game/injection'
import { recipeEditorOpen } from './open'
import { createRecipeEditor, recipeEditorKey } from './editor'
import type { ElementNodeData } from './editor'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'

const editor = createRecipeEditor()
const game = useGame()
const query = ref('')
const { fitView } = useVueFlow()

provide(recipeEditorKey, editor)

const matches = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return []
  return editor.recipes.filter((recipe) => {
    return recipe.name.toLowerCase().includes(needle) || recipe.id.includes(needle)
  }).slice(0, 8)
})

onMounted(frame)

useEventListener('keydown', onKeydown)

function isField(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement
}

function ingredientName(id: string) {
  return editor.recipes.find(item => item.id === id)?.name || id
}

function recipeQuestion(edgeId: string) {
  const match = /^pair:([a-z0-9_]+):(\d+):\d+$/.exec(edgeId)
  if (!match) return null
  const recipe = editor.recipes.find(item => item.id === match[1])
  const pair = recipe?.recipes[Number(match[2])]
  if (!pair) return null
  return `Удалить рецепт «${ingredientName(pair[0])} + ${ingredientName(pair[1])}»?`
}

async function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Delete' && event.key !== 'Backspace') return
  if (isField(event.target) || game.session.confirm.isOpen.value) return
  const edgeId = editor.selectedEdgeId
  if (!edgeId) return
  event.preventDefault()
  if (!edgeId.startsWith('draft:')) {
    const question = recipeQuestion(edgeId)
    if (!question) return
    const accepted = await game.session.confirm.ask(question)
    if (!accepted || editor.selectedEdgeId !== edgeId) return
    editor.removeEdge(edgeId)
    return
  }
  editor.removeEdge(edgeId)
}

function onNodeClick(payload: { node: Node }) {
  if (payload.node.type !== 'element') return
  const data = payload.node.data as ElementNodeData
  editor.open(data.elementId)
  frame()
}

function onEdgeClick(payload: { edge: { id: string } }) {
  editor.selectEdge(payload.edge.id)
}

function onConnect(connection: Connection) {
  if (!connection.source || !connection.target) return
  editor.connect(connection.source, connection.target)
}

async function frame() {
  await nextTick()
  await fitView({ padding: 0.2, duration: 0 })
  await new Promise((resolve) => {
    window.setTimeout(resolve, 50)
  })
  await fitView({ padding: 0.2, duration: 180 })
}

function goHome() {
  editor.home()
  frame()
}

function goBack() {
  editor.back()
  frame()
}

function goForward() {
  editor.forward()
  frame()
}

async function createElement() {
  editor.createElement()
  await frame()
}

async function focusFirst() {
  const match = matches.value[0]
  if (!match) return
  await focusMatch(match.id)
}

async function focusMatch(id: string) {
  editor.open(id)
  query.value = ''
  await frame()
}

async function closeEditor() {
  if (editor.dirty) {
    const accepted = await game.session.confirm.ask('Закрыть редактор без сохранения?')
    if (!accepted) return
  }
  recipeEditorOpen.value = false
}
</script>

<style scoped lang="scss">
.editor {
  display: flex;
  position: fixed;
  flex-direction: column;
  z-index: 70;
  inset: 0;
  background: var(--background);
  color: var(--foreground);
}

.toolbar {
  display: flex;
  position: relative;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  z-index: 2;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--card) 92%, transparent);
  padding: 10px 12px;
}

.match {
  border-radius: 12px;
  padding: 8px 12px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 2px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: color-mix(in srgb, var(--background) 55%, transparent);
  padding: 3px;
}

.controls button {
  display: grid;
  place-items: center;
  border-radius: 10px;
  width: 36px;
  height: 36px;
}

.controls button:disabled {
  opacity: 0.45;
  cursor: default;
  pointer-events: none;
}

.controls svg {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
  width: 18px;
  height: 18px;
}

.split {
  margin: 0 2px;
  background: var(--border);
  width: 1px;
  height: 20px;
}

.search {
  position: relative;
  flex: 1 1 220px;
  min-width: 160px;
}

.search-input {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--background);
  padding: 0 12px;
  width: 100%;
  height: 40px;
  color: var(--foreground);
  font: inherit;
  user-select: text;
}

.matches {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  left: 0;
  z-index: 3;
  margin: 0;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card);
  padding: 4px;
  list-style: none;
}

.match {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  text-align: left;
}

.match-id,
.error {
  color: var(--muted-foreground);
  font-size: 12px;
}

.error {
  flex: 1 1 100%;
  margin: 0;
  overflow: hidden;
  color: var(--destructive);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace {
  display: flex;
  flex: 1;
  min-height: 0;
}

.canvas {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

:deep(.vue-flow) {
  background: var(--background);
}

:deep(.vue-flow__node-element),
:deep(.vue-flow__node-plus) {
  box-shadow: none;
  border: 0;
  border-radius: 0;
  background: transparent;
  padding: 0;
}

:deep(.vue-flow__handle) {
  border: 0;
  background: var(--primary);
  width: 8px;
  height: 8px;
}

:deep(.vue-flow__connection-path),
:deep(.vue-flow__edge.recipe-edge.is-draft .vue-flow__edge-path) {
  stroke: var(--primary);
}

.join {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: var(--muted-foreground);
  font-size: 22px;
  line-height: 1;
}

:deep(.vue-flow__edge.recipe-edge .vue-flow__edge-path) {
  stroke: var(--muted-foreground);
  stroke-width: 1.4;
}

:deep(.vue-flow__edge.recipe-edge.is-propagate .vue-flow__edge-path) {
  stroke-dasharray: 6 4;
}

:deep(.vue-flow__edge.recipe-edge.is-active .vue-flow__edge-path),
:deep(.vue-flow__edge.recipe-edge.is-picked .vue-flow__edge-path) {
  stroke-width: 2.2;
}

:deep(.vue-flow__edge.recipe-edge.is-dim) {
  opacity: 0.16;
}

:deep(.vue-flow__controls) {
  box-shadow: none;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

:deep(.vue-flow__controls-button) {
  fill: var(--foreground);
  border-bottom-color: var(--border);
  background: var(--card);
}

:deep(.vue-flow__attribution) {
  background: transparent;
  color: var(--muted-foreground);
}
</style>
