<template>
  <aside
    v-if="recipe"
    class="inspector"
  >
    <header class="header">
      <h2 class="title">
        {{ recipe.name }}
      </h2>
      <button
        class="press icon"
        type="button"
        aria-label="Закрыть"
        @click="editor.clearSelection()"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </header>
    <div class="body">
      <label class="field">
        <span>Id</span>
        <input
          v-model="idDraft"
          type="text"
          spellcheck="false"
          @keydown.enter.prevent="commitId"
          @blur="commitId"
        >
      </label>
      <label class="field">
        <span>Имя</span>
        <input
          v-model="recipe.name"
          type="text"
          @input="editor.syncNode(recipe.id)"
        >
      </label>
      <label class="field">
        <span>Описание</span>
        <textarea
          v-model="recipe.description"
          rows="4"
          @input="editor.touch()"
        />
      </label>
      <fieldset class="categories">
        <legend>Категории</legend>
        <label
          v-for="choice in editor.categoryChoices"
          :key="choice.id"
          class="check"
        >
          <input
            type="checkbox"
            :checked="recipe.category?.includes(choice.id)"
            @change="onCategory(choice.id, $event)"
          >
          {{ choice.label }}
        </label>
      </fieldset>
      <section class="pairs">
        <h3>Рецепты</h3>
        <p
          v-if="!recipe.recipes.length && !draft"
          class="empty"
        >
          Нет рецептов
        </p>
        <div
          v-for="(pair, index) in recipe.recipes"
          :key="`${pair[0]}-${pair[1]}-${index}`"
          class="pair"
        >
          <alchemy-combobox
            :value="pair[0]"
            :options="optionsFor(pair[0])"
            label="Ингредиент"
            @select="onIngredient(index, 0, $event)"
          />
          <span class="plus">+</span>
          <alchemy-combobox
            :value="pair[1]"
            :options="optionsFor(pair[1])"
            label="Ингредиент"
            @select="onIngredient(index, 1, $event)"
          />
          <div class="pair-actions">
            <label class="check">
              <input
                type="checkbox"
                :checked="pair.length === 3"
                @change="onPropagate(index, $event)"
              >
              Создавать два элемента
            </label>
            <button
              class="press icon pair-delete"
              type="button"
              aria-label="Удалить рецепт"
              @click="removeRecipe(index)"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
          </div>
        </div>
        <div
          v-if="draft"
          class="pair draft"
        >
          <alchemy-combobox
            :value="draft.left"
            :options="optionsFor(draft.left)"
            placeholder="Ингредиент"
            label="Ингредиент"
            @select="onDraft('left', $event)"
          />
          <span class="plus">+</span>
          <alchemy-combobox
            :value="draft.right"
            :options="optionsFor(draft.right)"
            placeholder="Ингредиент"
            label="Ингредиент"
            @select="onDraft('right', $event)"
          />
          <div class="pair-actions">
            <label class="check">
              <input
                type="checkbox"
                :checked="draft.propagate"
                @change="onDraftPropagate"
              >
              Создавать два элемента
            </label>
            <button
              class="press icon"
              type="button"
              aria-label="Отмена"
              @click="editor.cancelDraft(recipe.id)"
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
        <button
          class="press add"
          type="button"
          :disabled="Boolean(draft)"
          @click="editor.beginDraft(recipe.id)"
        >
          Новая пара
        </button>
      </section>
      <button
        class="press danger remove"
        type="button"
        @click="remove"
      >
        Удалить элемент
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AlchemyCombobox from '@/shared/ui/alchemy-combobox.vue'
import { useGame } from '@/game/injection'
import { useRecipeEditor } from './editor'

const editor = useRecipeEditor()
const game = useGame()
const recipe = computed(() => editor.selected)
const draft = computed(() => editor.draft)
const idDraft = ref('')

watch(() => editor.selected?.id, (id) => {
  idDraft.value = id ?? ''
}, { immediate: true })

function commitId() {
  if (!recipe.value) return
  const message = editor.rename(recipe.value.id, idDraft.value)
  if (!message) return
  editor.error = message
  idDraft.value = recipe.value.id
}

function onCategory(categoryId: string, event: Event) {
  if (!recipe.value) return
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  editor.toggleCategory(recipe.value.id, categoryId, input.checked)
}

function onIngredient(index: number, slot: 0 | 1, ingredientId: string) {
  if (!recipe.value || !ingredientId) return
  editor.setIngredient({
    resultId: recipe.value.id,
    index,
    slot,
    ingredientId,
  })
}

function onPropagate(index: number, event: Event) {
  if (!recipe.value) return
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  editor.setPropagate(recipe.value.id, index, input.checked)
}

function onDraft(slot: 'left' | 'right', ingredientId: string) {
  if (!recipe.value) return
  editor.setDraftIngredient(recipe.value.id, slot, ingredientId)
}

function onDraftPropagate(event: Event) {
  if (!recipe.value) return
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  editor.setDraftPropagate(recipe.value.id, input.checked)
}

function optionsFor(current: string) {
  const options = editor.recipes.map(item => ({
    id: item.id,
    label: item.name,
  }))
  if (current && !options.some(item => item.id === current)) {
    options.unshift({
      id: current,
      label: `${current} (нет элемента)`,
    })
  }
  return options
}

function ingredientName(id: string) {
  return editor.recipes.find(item => item.id === id)?.name || id
}

async function removeRecipe(index: number) {
  if (!recipe.value) return
  const pair = recipe.value.recipes[index]
  if (!pair) return
  const accepted = await game.session.confirm.ask(`Удалить рецепт «${ingredientName(pair[0])} + ${ingredientName(pair[1])}»?`)
  if (!accepted) return
  editor.removePair(recipe.value.id, index)
}

async function remove() {
  if (!recipe.value) return
  const accepted = await game.session.confirm.ask(`Удалить «${recipe.value.name}»?`)
  if (!accepted) return
  editor.remove(recipe.value.id)
}
</script>

<style scoped lang="scss">
.inspector {
  display: flex;
  flex: none;
  flex-direction: column;
  border-left: 1px solid var(--border);
  background: var(--card);
  width: min(360px, 100%);
  min-height: 0;
  color: var(--foreground);
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--border);
  padding: 12px 12px 12px 16px;
}

.title {
  flex: 1;
  margin: 0;
  min-width: 0;
  overflow: hidden;
  color: var(--foreground);
  font-size: 18px;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon {
  display: grid;
  flex: none;
  place-items: center;
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

.body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  min-height: 0;
  overflow: auto;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--muted-foreground);
  font-size: 13px;
}

.field input,
.field textarea {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--background);
  padding: 8px 10px;
  width: 100%;
  color: var(--foreground);
  font: inherit;
  font-size: 15px;
  user-select: text;
}

.field textarea {
  resize: vertical;
}

.empty {
  margin: -4px 0 0;
  color: var(--muted-foreground);
  font-size: 12px;
}

.categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin: 0;
  border: 0;
  padding: 0;
}

.categories legend {
  margin-bottom: 8px;
  width: 100%;
  color: var(--muted-foreground);
  font-size: 13px;
}

.pairs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pairs h3 {
  margin: 0;
  color: var(--foreground);
  font-size: 14px;
}

.pair {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 8px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px;
}

.pair.draft {
  border-style: dashed;
}

.plus {
  align-self: center;
  color: var(--muted-foreground);
}

.pair-actions,
.add,
.remove {
  grid-column: 1 / -1;
}

.pair-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pair-actions .check {
  flex: 1;
  min-width: 0;
}

.pair-delete {
  flex: none;
  color: var(--destructive);

  &:hover,
  &:active {
    color: var(--destructive);
  }
}

.add,
.remove {
  border-radius: 10px;
  padding: 8px 10px;
}

.remove {
  margin-top: 8px;
}
</style>
