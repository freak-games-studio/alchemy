import { ref, watch } from 'vue'

import { storageKeys } from '@/shared/storage'

function readOpen(): boolean {
  if (!import.meta.env.DEV) return false
  return sessionStorage.getItem(storageKeys.recipeEditor) === '1'
}

export const recipeEditorOpen = ref(readOpen())

watch(recipeEditorOpen, (open) => {
  sessionStorage.setItem(storageKeys.recipeEditor, open ? '1' : '0')
})

export function markRecipeEditorOpen() {
  sessionStorage.setItem(storageKeys.recipeEditor, '1')
  recipeEditorOpen.value = true
}
