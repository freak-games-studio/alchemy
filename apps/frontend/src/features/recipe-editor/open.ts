import { ref, watch } from 'vue'

const storageKey = 'alchemy-recipe-editor'

function readOpen(): boolean {
  if (!import.meta.env.DEV) return false
  return sessionStorage.getItem(storageKey) === '1'
}

export const recipeEditorOpen = ref(readOpen())

watch(recipeEditorOpen, (open) => {
  sessionStorage.setItem(storageKey, open ? '1' : '0')
})

export function markRecipeEditorOpen() {
  sessionStorage.setItem(storageKey, '1')
  recipeEditorOpen.value = true
}
