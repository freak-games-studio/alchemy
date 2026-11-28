<template>
  <aside
    v-if="recipe"
    class="inspector"
  >
    <header class="inspector__header">
      <h2 class="inspector__title">
        {{ recipe.name }}
      </h2>
      <button
        class="press inspector__close"
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
    <div class="inspector__body">
      <div class="inspector__field">
        <span>Изображение</span>
        <span class="inspector__samples">
          <label
            class="inspector__sprite"
            :class="{
              'inspector__sprite--over': dragging,
              'inspector__sprite--filled': showSprite,
            }"
            @dragenter.prevent="onDragEnter"
            @dragover.prevent
            @dragleave="onDragLeave"
            @drop.prevent="onDrop"
          >
            <img
              v-show="showSprite"
              :key="shown"
              class="inspector__preview"
              :src="shown"
              alt=""
              @error="onPreviewError"
            >
            <span
              v-if="!showSprite"
              class="inspector__fallback"
            >{{ recipe.name.slice(0, 1) }}</span>
            <input
              class="inspector__file"
              type="file"
              accept="image/*"
              @change="onFile"
            >
          </label>
          <span
            v-if="showSprite"
            class="inspector__plates"
            aria-hidden="true"
          >
            <span class="inspector__plate inspector__plate--dark">
              <img
                :key="shown"
                :src="shown"
                alt=""
              >
            </span>
            <span class="inspector__plate inspector__plate--light">
              <img
                :key="`${shown}-light`"
                :src="shown"
                alt=""
              >
            </span>
          </span>
        </span>
      </div>
      <label class="inspector__field">
        <span>Id</span>
        <input
          v-model="idDraft"
          class="inspector__control"
          type="text"
          spellcheck="false"
          @keydown.enter.prevent="commitId"
          @blur="commitId"
        >
      </label>
      <label class="inspector__field">
        <span>Имя</span>
        <input
          v-model="recipe.name"
          class="inspector__control"
          type="text"
          @input="editor.syncNode(recipe.id)"
        >
      </label>
      <label class="inspector__field">
        <span>Описание</span>
        <textarea
          v-model="recipe.description"
          class="inspector__control inspector__textarea"
          rows="4"
          @input="editor.touch()"
        />
      </label>
      <fieldset class="inspector__categories">
        <legend class="inspector__legend">
          Категории
        </legend>
        <label
          v-for="choice in editor.categoryChoices"
          :key="choice.id"
          class="check"
        >
          <input
            class="check__input"
            type="checkbox"
            :checked="recipe.category?.includes(choice.id)"
            @change="onCategory(choice.id, $event)"
          >
          {{ choice.label }}
        </label>
      </fieldset>
      <section class="inspector__pairs">
        <h3 class="inspector__pairs-title">
          Рецепты
        </h3>
        <div
          v-for="(pair, index) in recipe.recipes"
          :key="`${pair[0]}-${pair[1]}-${index}`"
          class="inspector__pair"
        >
          <alchemy-combobox
            :value="pair[0]"
            :options="optionsFor(pair[0])"
            label="Ингредиент"
            span=".inspector__pair"
            autofocus
            @select="onIngredient(index, 0, $event)"
          />
          <span class="inspector__plus">+</span>
          <alchemy-combobox
            :value="pair[1]"
            :options="optionsFor(pair[1])"
            label="Ингредиент"
            span=".inspector__pair"
            autofocus
            @select="onIngredient(index, 1, $event)"
          />
          <div class="inspector__pair-actions">
            <label class="check">
              <input
                class="check__input"
                type="checkbox"
                :checked="pair.length === 3"
                @change="onPropagate(index, $event)"
              >
              Создавать два элемента
            </label>
            <button
              class="press inspector__pair-delete"
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
          class="inspector__pair inspector__pair--draft"
        >
          <alchemy-combobox
            :value="draft.left"
            :options="optionsFor(draft.left)"
            placeholder="Ингредиент"
            label="Ингредиент"
            span=".inspector__pair"
            autofocus
            @select="onDraft('left', $event)"
          />
          <span class="inspector__plus">+</span>
          <alchemy-combobox
            :value="draft.right"
            :options="optionsFor(draft.right)"
            placeholder="Ингредиент"
            label="Ингредиент"
            span=".inspector__pair"
            autofocus
            @select="onDraft('right', $event)"
          />
          <div class="inspector__pair-actions">
            <label class="check">
              <input
                class="check__input"
                type="checkbox"
                :checked="draft.propagate"
                @change="onDraftPropagate"
              >
              Создавать два элемента
            </label>
            <button
              class="press inspector__close"
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
          class="press inspector__add"
          type="button"
          :disabled="Boolean(draft)"
          @click="editor.beginDraft(recipe.id)"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Добавить рецепт
        </button>
      </section>
      <button
        class="press press--danger inspector__remove"
        type="button"
        @click="remove"
      >
        Удалить элемент
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'

import AlchemyCombobox from '@/shared/ui/alchemy-combobox.vue'
import { useGame } from '@/game/injection'
import { spriteUrl } from '@/assets/sprite'
import { ingredientName, useRecipeEditor } from './editor'
import { removeSprite, renameSprite, saveSprite } from './sprite-file'

const editor = useRecipeEditor()
const game = useGame()
const recipe = computed(() => editor.selected)
const draft = computed(() => editor.draft)
const idDraft = ref('')
const spriteFailed = ref(false)
const dragging = ref(false)
const localPreview = ref('')
let dragDepth = 0
let localUrl = ''
const preview = computed(() => recipe.value
  ? spriteUrl(recipe.value.id)
  : '')
const shown = computed(() => localPreview.value || preview.value)
const showSprite = computed(() => Boolean(localPreview.value) || !spriteFailed.value)

watch(() => editor.selected?.id, (id) => {
  idDraft.value = id ?? ''
  releaseLocal()
}, { immediate: true })

watch(preview, () => {
  spriteFailed.value = false
})

function releaseLocal() {
  const url = localUrl
  localUrl = ''
  localPreview.value = ''
  dragDepth = 0
  dragging.value = false
  if (!url) return
  nextTick(() => URL.revokeObjectURL(url))
}

onUnmounted(releaseLocal)

function failure(cause: unknown, fallback: string) {
  editor.error = cause instanceof Error
    ? cause.message
    : fallback
}

async function commitId() {
  if (!recipe.value) return
  const from = recipe.value.id
  const message = editor.rename(from, idDraft.value)
  if (message) {
    editor.error = message
    idDraft.value = recipe.value.id
    return
  }
  if (from === recipe.value.id) return
  try {
    await renameSprite(from, recipe.value.id)
    editor.error = ''
  } catch (cause) {
    failure(cause, 'Не удалось переименовать картинку')
  }
}

function onDragEnter() {
  dragDepth += 1
  dragging.value = true
}

function onDragLeave() {
  dragDepth -= 1
  if (dragDepth > 0) return
  dragDepth = 0
  dragging.value = false
}

function onDrop(event: DragEvent) {
  dragDepth = 0
  dragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) useSprite(file)
}

function onFile(event: Event) {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  const file = input.files?.[0]
  input.value = ''
  if (file) useSprite(file)
}

function onPreviewError(event: Event) {
  if (localPreview.value) return
  const image = event.target
  if (!(image instanceof HTMLImageElement)) return
  if (image.getAttribute('src') !== shown.value) return
  spriteFailed.value = true
}

async function useSprite(file: File) {
  if (!recipe.value) return
  const id = recipe.value.id
  releaseLocal()
  const url = URL.createObjectURL(file)
  localUrl = url
  localPreview.value = url
  spriteFailed.value = false
  try {
    await saveSprite(id, file)
    editor.error = ''
  } catch (cause) {
    failure(cause, 'Не удалось сохранить картинку')
  } finally {
    if (localUrl === url) {
      localPreview.value = ''
      localUrl = ''
      await nextTick()
      URL.revokeObjectURL(url)
    }
  }
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
    image: spriteUrl(item.id),
    ended: Boolean(item.ended),
  }))
  if (current && !options.some(item => item.id === current)) {
    options.unshift({
      id: current,
      label: `${current} (нет элемента)`,
      image: spriteUrl(current),
      ended: false,
    })
  }
  return options
}

async function removeRecipe(index: number) {
  if (!recipe.value) return
  const pair = recipe.value.recipes[index]
  if (!pair) return
  const accepted = await game.session.confirm.ask(`Удалить рецепт «${ingredientName(editor.recipes, pair[0])} + ${ingredientName(editor.recipes, pair[1])}»?`)
  if (!accepted) return
  editor.removePair(recipe.value.id, index)
}

async function remove() {
  if (!recipe.value) return
  const accepted = await game.session.confirm.ask(`Удалить «${recipe.value.name}»?`)
  if (!accepted) return
  const id = recipe.value.id
  editor.remove(id)
  try {
    await removeSprite(id)
  } catch (cause) {
    failure(cause, 'Не удалось удалить картинку')
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.inspector {
  display: flex;
  flex: none;
  flex-direction: column;
  border-left: 1px solid var(--border);
  background: var(--card);
  width: min(400px, 100%);
  min-height: 0;
  color: var(--foreground);

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid var(--border);
    padding: 12px 12px 12px 16px;
  }

  &__title {
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

  &__close,
  &__pair-delete {
    @include icon-button;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    min-height: 0;
    overflow: auto;
  }

  &__samples {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__plates {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__plate {
    display: grid;
    flex: none;
    place-items: center;
    border-radius: 10px;
    width: 56px;
    height: 56px;
    overflow: hidden;

    &--dark {
      background: #000;
    }

    &--light {
      background: #fff;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      pointer-events: none;
    }
  }

  &__sprite {
    display: grid;
    position: relative;
    flex: none;
    place-items: center;
    cursor: pointer;
    box-sizing: border-box;
    border: 1px dashed var(--border);
    border-radius: 16px;
    background: var(--muted);
    width: 120px;
    height: 120px;
    overflow: hidden;

    &:hover,
    &--over {
      border-style: solid;
      border-color: var(--primary);
    }
  }

  &__preview,
  &__fallback {
    width: 100%;
    height: 100%;
  }

  &__preview {
    object-fit: contain;
    pointer-events: none;
  }

  &__fallback {
    display: grid;
    place-items: center;
    pointer-events: none;
    color: var(--foreground);
    font-size: 28px;
  }

  &__file {
    display: none;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: var(--muted-foreground);
    font-size: 13px;
  }

  &__control {
    @include text-field(10px);
    padding: 8px 10px;
    width: 100%;
    font-size: 15px;
  }

  &__textarea {
    resize: vertical;
  }

  &__categories {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    margin: 0;
    border: 0;
    padding: 0;
  }

  &__legend {
    margin-bottom: 8px;
    width: 100%;
    color: var(--muted-foreground);
    font-size: 13px;
  }

  &__pairs {
    display: flex;
    flex-direction: column;
    gap: 10px;

    &-title {
      margin: 0;
      color: var(--muted-foreground);
      font-size: 14px;
    }
  }

  &__empty {
    color: var(--muted-foreground);
    font-size: 12px;
    text-align: center;
  }

  &__pair {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 8px;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 8px;

    &--draft {
      border-style: dashed;
    }
  }

  &__plus {
    align-self: center;
    color: var(--muted-foreground);
  }

  &__pair-actions {
    display: flex;
    grid-column: 1 / -1;
    align-items: center;
    gap: 8px;

    .check {
      flex: 1;
      min-width: 0;
    }
  }

  &__pair-delete {
    color: var(--destructive);

    &:hover,
    &:active {
      color: var(--destructive);
    }
  }

  &__add {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    border: 1px dashed var(--border);
    border-radius: 12px;
    padding: 10px 12px;
    width: 100%;
    color: var(--foreground);

    svg {
      @include icon-stroke(16px);
    }

    &:hover {
      border-style: solid;
      border-color: var(--primary);
    }

    &:disabled {
      opacity: 0.45;
      cursor: default;
      pointer-events: none;
    }
  }

  &__remove {
    margin-top: 8px;
    border-radius: 10px;
    padding: 8px 10px;
  }
}
</style>
