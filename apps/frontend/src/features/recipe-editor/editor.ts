import { MarkerType } from '@xyflow/vue'
import { computed, inject, reactive, ref, shallowRef } from 'vue'
import type { InjectionKey } from 'vue'
import type { Connection, Edge, Node } from '@xyflow/vue'

import { categoryLabel, loadRecipes, recipeCategoryOrder, recipeSource, refreshEnded } from '@/game/recipe'
import { layoutFocus } from './layout'
import { markRecipeEditorOpen } from './open'
import { serializeRecipes } from './validate'
import type { RecipeDefinition, RecipePair } from '@/game/recipe'
import type { LayoutNode } from './layout'

const PAIR_COLORS = [
  '#e08a45',
  '#7eb6ff',
  '#6fce9f',
  '#d7a4ff',
  '#f0c75e',
  '#ff8faf',
]

export interface ElementNodeData extends Record<string, unknown> {
  elementId: string
  name: string
  ended: boolean
  badges: string[]
  current: boolean
  pairIndex: number | null
}

export type RecipeNode = Node<ElementNodeData, 'element'> | Node<Record<string, unknown>, 'plus'>

export interface DraftPair {
  resultId: string
  left: string
  right: string
  propagate: boolean
}

export interface IngredientChange {
  resultId: string
  index: number
  slot: 0 | 1
  ingredientId: string
}

export interface RecipeEditorApi {
  recipes: RecipeDefinition[]
  nodes: RecipeNode[]
  edges: Edge[]
  selectedId: string | null
  selectedEdgeId: string | null
  selected: RecipeDefinition | null
  draft: DraftPair | null
  dirty: boolean
  saving: boolean
  error: string
  categoryChoices: { id: string, label: string }[]
  centerId: string | null
  canGoBack: boolean
  canGoForward: boolean
  home: () => void
  back: () => void
  forward: () => void
  open: (id: string) => void
  connect: (source: string, target: string) => void
  canConnect: (connection: Connection | Edge) => boolean
  removeEdge: (edgeId: string) => void
  selectNode: (id: string) => void
  selectEdge: (id: string) => void
  clearSelection: () => void
  syncNode: (id: string) => void
  touch: () => void
  rename: (from: string, to: string) => string | null
  toggleCategory: (id: string, categoryId: string, enabled: boolean) => void
  setIngredient: (change: IngredientChange) => void
  setPropagate: (resultId: string, index: number, enabled: boolean) => void
  removePair: (resultId: string, index: number) => void
  beginDraft: (resultId: string) => void
  setDraftIngredient: (resultId: string, slot: 'left' | 'right', ingredientId: string) => void
  setDraftPropagate: (resultId: string, enabled: boolean) => void
  cancelDraft: (resultId: string) => void
  createElement: () => string
  remove: (id: string) => void
  save: () => Promise<void>
}

export const recipeEditorKey: InjectionKey<RecipeEditorApi> = Symbol('recipe-editor')

export function useRecipeEditor(): RecipeEditorApi {
  const editor = inject(recipeEditorKey)
  if (!editor) throw new Error('Recipe editor context is missing')
  return editor
}

function clonePair(pair: RecipePair): RecipePair {
  if (pair.length === 3) return [pair[0], pair[1], true]
  return [pair[0], pair[1]]
}

function cloneRecipes(): RecipeDefinition[] {
  return recipeSource().map((recipe) => {
    const next: RecipeDefinition = {
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      recipes: recipe.recipes.map(clonePair),
    }
    if (recipe.category?.length) next.category = [...recipe.category]
    if (recipe.ended) next.ended = true
    return next
  })
}

function pairKey(left: string, right: string): string {
  return left < right
    ? `${left}\0${right}`
    : `${right}\0${left}`
}

function hasPair(recipe: RecipeDefinition, pair: { left: string, right: string, skipIndex?: number }): boolean {
  const key = pairKey(pair.left, pair.right)
  return recipe.recipes.some((item, index) => {
    if (index === pair.skipIndex) return false
    return pairKey(item[0], item[1]) === key
  })
}

function elementData(recipe: RecipeDefinition, current: boolean, pairIndex: number | null): ElementNodeData {
  return {
    elementId: recipe.id,
    name: recipe.name,
    ended: Boolean(recipe.ended),
    badges: (recipe.category ?? []).map(id => categoryLabel(id)),
    current,
    pairIndex,
  }
}

export function createRecipeEditor(): RecipeEditorApi {
  const recipes = ref<RecipeDefinition[]>(cloneRecipes())
  const nodes = shallowRef<RecipeNode[]>([])
  const edges = shallowRef<Edge[]>([])
  const drafts = ref<DraftPair[]>([])
  const centerId = ref<string | null>(null)
  const history = ref<Array<string | null>>([])
  const future = ref<Array<string | null>>([])
  const selectedId = ref<string | null>(null)
  const selectedEdgeId = ref<string | null>(null)
  const dirty = ref(false)
  const saving = ref(false)
  const error = ref('')

  const selected = computed(() => recipes.value.find(recipe => recipe.id === selectedId.value) ?? null)
  const canGoBack = computed(() => history.value.length > 0)
  const canGoForward = computed(() => future.value.length > 0)
  const draft = computed(() => drafts.value.find(item => item.resultId === selectedId.value) ?? null)
  const categoryChoices = computed(() => {
    const extras = new Set<string>()
    for (const recipe of recipes.value) {
      for (const categoryId of recipe.category ?? []) {
        if (!recipeCategoryOrder.includes(categoryId)) extras.add(categoryId)
      }
    }
    return [
      ...recipeCategoryOrder.map(id => ({
        id,
        label: categoryLabel(id),
      })),
      ...[...extras].map(id => ({
        id,
        label: categoryLabel(id),
      })),
    ]
  })

  function findRecipe(id: string): RecipeDefinition | undefined {
    return recipes.value.find(recipe => recipe.id === id)
  }

  function refreshEdges() {
    const known = new Set(nodes.value.map(node => node.id))
    const next: Edge[] = []
    const active = selectedId.value
    const pickedEdge = selectedEdgeId.value
    const center = centerId.value
    const context = {
      known,
      active,
      pickedEdge,
      center,
    }

    if (center && known.has(center)) {
      const focus = findRecipe(center)
      if (focus) {
        for (let index = 0; index < focus.recipes.length; index += 1) {
          const pair = focus.recipes[index]
          if (!pair) continue
          const tone = PAIR_COLORS[index % PAIR_COLORS.length] ?? PAIR_COLORS[0]
          if (pair[0] === pair[1]) {
            pushEdge(next, {
              ...context,
              id: `pair:${center}:${index}:2`,
              source: `in:${index}:0`,
              target: center,
              propagate: pair.length === 3,
              draft: false,
              tone,
            })
            continue
          }
          pushEdge(next, {
            ...context,
            id: `pair:${center}:${index}:0`,
            source: `in:${index}:0`,
            target: center,
            propagate: pair.length === 3,
            draft: false,
            tone,
          })
          pushEdge(next, {
            ...context,
            id: `pair:${center}:${index}:1`,
            source: `in:${index}:1`,
            target: center,
            propagate: pair.length === 3,
            draft: false,
            tone,
          })
        }
      }

      for (const recipe of recipes.value) {
        if (recipe.id === center || !known.has(recipe.id)) continue
        for (let index = 0; index < recipe.recipes.length; index += 1) {
          const pair = recipe.recipes[index]
          if (!pair || (pair[0] !== center && pair[1] !== center)) continue
          let slot = 1
          if (pair[0] === pair[1]) slot = 2
          else if (pair[0] === center) slot = 0
          pushEdge(next, {
            ...context,
            id: `pair:${recipe.id}:${index}:${slot}`,
            source: center,
            target: recipe.id,
            propagate: pair.length === 3,
            draft: false,
            tone: '',
          })
        }
      }
    }

    for (const item of drafts.value) {
      const ingredient = item.left || item.right
      const source = ingredient
        ? anchor(ingredient)
        : null
      const target = anchor(item.resultId)
      if (!source || !target) continue
      pushEdge(next, {
        ...context,
        id: `draft:${item.resultId}`,
        source,
        target,
        propagate: false,
        draft: true,
        tone: '',
      })
    }

    edges.value = next
  }

  function anchor(elementId: string): string | null {
    if (nodes.value.some(node => node.id === elementId && node.type === 'element')) return elementId
    const copy = nodes.value.find((node) => {
      return node.type === 'element' && (node.data as ElementNodeData).elementId === elementId
    })
    return copy?.id ?? null
  }

  function resolveElement(nodeId: string): string | null {
    const node = nodes.value.find(item => item.id === nodeId)
    if (!node || node.type !== 'element') return null
    return (node.data as ElementNodeData).elementId
  }

  function elementNode(recipe: RecipeDefinition, item: LayoutNode): Node<ElementNodeData, 'element'> {
    return {
      id: item.id,
      type: 'element',
      position: { x: item.x, y: item.y },
      data: elementData(recipe, item.id === centerId.value, item.pairIndex),
      width: item.width,
      height: item.height,
      draggable: true,
      connectable: true,
      deletable: false,
    }
  }

  function plusNode(item: LayoutNode): Node<Record<string, unknown>, 'plus'> {
    return {
      id: item.id,
      type: 'plus',
      position: { x: item.x, y: item.y },
      data: {},
      width: item.width,
      height: item.height,
      draggable: false,
      selectable: false,
      connectable: false,
      deletable: false,
    }
  }

  function relayout() {
    refreshEnded(recipes.value)
    const placed = layoutFocus(recipes.value, centerId.value)
    const next: RecipeNode[] = []
    for (const item of placed) {
      if (item.kind === 'plus') {
        next.push(plusNode(item))
        continue
      }
      const recipe = findRecipe(item.elementId)
      if (!recipe) continue
      next.push(elementNode(recipe, item))
    }
    nodes.value = next
    refreshEdges()
  }

  function open(id: string) {
    if (!findRecipe(id)) return
    selectedEdgeId.value = null
    selectedId.value = id
    if (centerId.value === id) {
      refreshEdges()
      return
    }
    history.value = [...history.value, centerId.value]
    future.value = []
    centerId.value = id
    relayout()
  }

  function home() {
    if (centerId.value === null) {
      selectedId.value = null
      selectedEdgeId.value = null
      refreshEdges()
      return
    }
    history.value = [...history.value, centerId.value]
    future.value = []
    centerId.value = null
    selectedId.value = null
    selectedEdgeId.value = null
    relayout()
  }

  function back() {
    const previous = history.value.at(-1)
    if (previous === undefined) return
    history.value = history.value.slice(0, -1)
    future.value = [...future.value, centerId.value]
    centerId.value = previous && findRecipe(previous)
      ? previous
      : null
    selectedId.value = centerId.value
    selectedEdgeId.value = null
    relayout()
  }

  function forward() {
    const next = future.value.at(-1)
    if (next === undefined) return
    future.value = future.value.slice(0, -1)
    history.value = [...history.value, centerId.value]
    centerId.value = next && findRecipe(next)
      ? next
      : null
    selectedId.value = centerId.value
    selectedEdgeId.value = null
    relayout()
  }

  function syncNode(id: string) {
    const recipe = findRecipe(id)
    if (!recipe) return
    dirty.value = true
    nodes.value = nodes.value.map((node) => {
      if (node.type !== 'element') return node
      const data = node.data as ElementNodeData
      if (data.elementId !== id) return node
      return {
        ...node,
        data: elementData(recipe, node.id === centerId.value, data.pairIndex),
      }
    })
  }

  function touch() {
    dirty.value = true
  }

  function selectNode(id: string) {
    selectedEdgeId.value = null
    selectedId.value = id
    refreshEdges()
  }

  function selectEdge(id: string) {
    selectedEdgeId.value = id
    const resultId = id.startsWith('draft:')
      ? id.slice('draft:'.length)
      : /^pair:([a-z0-9_]+):/.exec(id)?.[1]
    if (resultId && findRecipe(resultId)) selectedId.value = resultId
    refreshEdges()
  }

  function clearSelection() {
    selectedId.value = null
    selectedEdgeId.value = null
    refreshEdges()
  }

  function commitPair(item: DraftPair) {
    const recipe = findRecipe(item.resultId)
    if (!recipe || !item.left || !item.right) return
    if (hasPair(recipe, { left: item.left, right: item.right })) {
      error.value = 'Такая пара уже есть'
      return
    }
    const pair: RecipePair = item.propagate
      ? [item.left, item.right, true]
      : [item.left, item.right]
    recipe.recipes = [...recipe.recipes, pair]
    drafts.value = drafts.value.filter(draftItem => draftItem.resultId !== item.resultId)
    dirty.value = true
    error.value = ''
    relayout()
  }

  function connect(source: string, target: string) {
    const sourceId = resolveElement(source)
    const targetId = resolveElement(target)
    if (!sourceId || !targetId || !findRecipe(sourceId) || !findRecipe(targetId)) return
    source = sourceId
    target = targetId
    const existing = drafts.value.find(item => item.resultId === target)
    selectedId.value = target
    selectedEdgeId.value = null
    if (!existing) {
      drafts.value = [
        ...drafts.value,
        {
          resultId: target,
          left: source,
          right: '',
          propagate: false,
        },
      ]
      error.value = ''
      refreshEdges()
      return
    }
    if (!existing.left) {
      existing.left = source
      refreshEdges()
      return
    }
    if (!existing.right) {
      commitPair({ ...existing, right: source })
      return
    }
    error.value = 'Сначала завершите черновик'
  }

  function canConnect(connection: Connection | Edge): boolean {
    const source = connection.source
      ? resolveElement(connection.source)
      : null
    const target = connection.target
      ? resolveElement(connection.target)
      : null
    if (!source || !target) return false
    return Boolean(findRecipe(source) && findRecipe(target))
  }

  function cancelDraft(resultId: string) {
    drafts.value = drafts.value.filter(item => item.resultId !== resultId)
    if (selectedEdgeId.value === `draft:${resultId}`) selectedEdgeId.value = null
    refreshEdges()
  }

  function removeEdge(edgeId: string) {
    if (edgeId.startsWith('draft:')) {
      cancelDraft(edgeId.slice('draft:'.length))
      return
    }
    const match = /^pair:([a-z0-9_]+):(\d+):(\d+)$/.exec(edgeId)
    if (!match) return
    const resultId = match[1]
    const index = Number(match[2])
    const slot = Number(match[3])
    const recipe = findRecipe(resultId)
    const pair = recipe?.recipes[index]
    if (!recipe || !pair) return
    recipe.recipes = recipe.recipes.filter((_, pairIndex) => pairIndex !== index)
    dirty.value = true
    error.value = ''
    selectedId.value = resultId
    selectedEdgeId.value = null
    if (slot !== 2) {
      const remaining = slot === 0
        ? pair[1]
        : pair[0]
      drafts.value = [
        ...drafts.value.filter(item => item.resultId !== resultId),
        {
          resultId,
          left: remaining,
          right: '',
          propagate: pair.length === 3,
        },
      ]
    }
    relayout()
  }

  function rename(from: string, to: string): string | null {
    const nextId = to.trim()
    if (!/^[a-z0-9_]+$/.test(nextId)) return 'Id может содержать только a-z, 0-9 и _'
    if (from !== nextId && recipes.value.some(recipe => recipe.id === nextId)) return 'Такой id уже есть'
    if (from === nextId) return null
    recipes.value = recipes.value.map((recipe) => {
      return {
        ...recipe,
        id: recipe.id === from
          ? nextId
          : recipe.id,
        recipes: recipe.recipes.map((pair) => {
          const left = pair[0] === from
            ? nextId
            : pair[0]
          const right = pair[1] === from
            ? nextId
            : pair[1]
          if (pair.length === 3) return [left, right, true]
          return [left, right]
        }),
      }
    })
    drafts.value = drafts.value.map(item => ({
      resultId: item.resultId === from
        ? nextId
        : item.resultId,
      left: item.left === from
        ? nextId
        : item.left,
      right: item.right === from
        ? nextId
        : item.right,
      propagate: item.propagate,
    }))
    if (centerId.value === from) centerId.value = nextId
    history.value = history.value.map(item => item === from
      ? nextId
      : item)
    future.value = future.value.map(item => item === from
      ? nextId
      : item)
    selectedId.value = nextId
    dirty.value = true
    error.value = ''
    relayout()
    return null
  }

  function toggleCategory(id: string, categoryId: string, enabled: boolean) {
    const recipe = findRecipe(id)
    if (!recipe) return
    const current = new Set(recipe.category ?? [])
    if (enabled) current.add(categoryId)
    else current.delete(categoryId)
    const next = [...current]
    recipe.category = next.length ? next : undefined
    error.value = ''
    syncNode(id)
  }

  function setIngredient(change: IngredientChange) {
    const recipe = findRecipe(change.resultId)
    const pair = recipe?.recipes[change.index]
    if (!recipe || !pair) return
    const left = change.slot === 0
      ? change.ingredientId
      : pair[0]
    const right = change.slot === 1
      ? change.ingredientId
      : pair[1]
    if (hasPair(recipe, { left, right, skipIndex: change.index })) {
      error.value = 'Такая пара уже есть'
      return
    }
    const next = [...recipe.recipes]
    next[change.index] = pair.length === 3
      ? [left, right, true]
      : [left, right]
    recipe.recipes = next
    dirty.value = true
    error.value = ''
    relayout()
  }

  function setPropagate(resultId: string, index: number, enabled: boolean) {
    const recipe = findRecipe(resultId)
    const pair = recipe?.recipes[index]
    if (!recipe || !pair) return
    const next = [...recipe.recipes]
    next[index] = enabled
      ? [pair[0], pair[1], true]
      : [pair[0], pair[1]]
    recipe.recipes = next
    dirty.value = true
    refreshEdges()
  }

  function removePair(resultId: string, index: number) {
    const recipe = findRecipe(resultId)
    if (!recipe) return
    recipe.recipes = recipe.recipes.filter((_, pairIndex) => pairIndex !== index)
    dirty.value = true
    error.value = ''
    relayout()
  }

  function beginDraft(resultId: string) {
    if (drafts.value.some(item => item.resultId === resultId)) return
    drafts.value = [
      ...drafts.value,
      {
        resultId,
        left: '',
        right: '',
        propagate: false,
      },
    ]
  }

  function setDraftIngredient(resultId: string, slot: 'left' | 'right', ingredientId: string) {
    const item = drafts.value.find(draftItem => draftItem.resultId === resultId)
    if (!item) return
    item[slot] = ingredientId
    if (item.left && item.right) {
      commitPair(item)
      return
    }
    refreshEdges()
  }

  function setDraftPropagate(resultId: string, enabled: boolean) {
    const item = drafts.value.find(draftItem => draftItem.resultId === resultId)
    if (!item) return
    item.propagate = enabled
  }

  function nextElementId(): string {
    const ids = new Set(recipes.value.map(recipe => recipe.id))
    let index = recipes.value.length + 1
    let id = `element_${index}`
    while (ids.has(id)) {
      index += 1
      id = `element_${index}`
    }
    return id
  }

  function createElement(): string {
    const recipe: RecipeDefinition = {
      id: nextElementId(),
      name: 'Новый элемент',
      description: '',
      recipes: [],
    }
    recipes.value = [...recipes.value, recipe]
    history.value = [...history.value, centerId.value]
    future.value = []
    centerId.value = recipe.id
    dirty.value = true
    error.value = ''
    selectedEdgeId.value = null
    selectedId.value = recipe.id
    relayout()
    return recipe.id
  }

  function remove(id: string) {
    recipes.value = recipes.value
      .filter(recipe => recipe.id !== id)
      .map((recipe) => {
        return {
          ...recipe,
          recipes: recipe.recipes.filter(pair => pair[0] !== id && pair[1] !== id),
        }
      })
    drafts.value = drafts.value.filter(item => item.resultId !== id && item.left !== id && item.right !== id)
    history.value = history.value.filter(item => item !== id)
    future.value = future.value.filter(item => item !== id)
    if (centerId.value === id) centerId.value = null
    if (selectedId.value === id) selectedId.value = null
    dirty.value = true
    error.value = ''
    relayout()
  }

  async function save() {
    const result = serializeRecipes(recipes.value)
    if ('error' in result) {
      error.value = result.error
      return
    }
    saving.value = true
    error.value = ''
    markRecipeEditorOpen()
    try {
      const response = await fetch('/__alchemy/recipes', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: result.body,
      })
      if (!response.ok) {
        error.value = (await response.text()) || 'Не удалось сохранить'
        return
      }
      await loadRecipes()
      dirty.value = false
    } catch (cause) {
      error.value = cause instanceof Error
        ? cause.message
        : 'Не удалось сохранить'
    } finally {
      saving.value = false
    }
  }

  const api: RecipeEditorApi = reactive({
    recipes,
    nodes,
    edges,
    selectedId,
    selectedEdgeId,
    selected,
    draft,
    dirty,
    saving,
    error,
    categoryChoices,
    centerId,
    canGoBack,
    canGoForward,
    home,
    back,
    forward,
    open,
    connect,
    canConnect,
    removeEdge,
    selectNode,
    selectEdge,
    clearSelection,
    syncNode,
    touch,
    rename,
    toggleCategory,
    setIngredient,
    setPropagate,
    removePair,
    beginDraft,
    setDraftIngredient,
    setDraftPropagate,
    cancelDraft,
    createElement,
    remove,
    save,
  })

  relayout()
  return api
}

function pushEdge(list: Edge[], input: {
  known: Set<string>
  active: string | null
  pickedEdge: string | null
  id: string
  source: string
  target: string
  propagate: boolean
  draft: boolean
  center: string | null
  tone: string
}) {
  if (!input.known.has(input.source) || !input.known.has(input.target)) return
  if (!input.draft && input.center !== input.source && input.center !== input.target) return
  const classes = ['recipe-edge']
  if (input.draft) classes.push('recipe-edge--draft')
  if (input.propagate) classes.push('recipe-edge--propagate')
  const linked = input.active === input.source || input.active === input.target || input.active === input.center
  if (input.active && linked) classes.push('recipe-edge--active')
  if (input.active && !linked) classes.push('recipe-edge--dim')
  if (input.id === input.pickedEdge) classes.push('recipe-edge--picked')
  list.push({
    id: input.id,
    source: input.source,
    target: input.target,
    markerEnd: input.tone
      ? { type: MarkerType.ArrowClosed, color: input.tone }
      : MarkerType.ArrowClosed,
    interactionWidth: 12,
    reconnectable: false,
    class: classes.join(' '),
    style: input.tone
      ? { stroke: input.tone }
      : undefined,
  })
}
