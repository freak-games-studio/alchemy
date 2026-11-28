import { createApp } from 'vue'

import App from './app.vue'
import { loadRecipes } from '@/game/recipe'

import './styles/main.scss'

const root = document.querySelector<HTMLElement>('#app')

try {
  await loadRecipes()
  createApp(App).mount('#app')
} catch (cause) {
  if (!root) throw cause
  root.classList.remove('hidden')
  root.classList.add('boot-error')
  root.textContent = cause instanceof Error
    ? cause.message
    : 'Не удалось загрузить рецепты'
}
