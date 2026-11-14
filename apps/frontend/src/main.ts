import { createApp } from 'vue'

import App from './app.vue'
import { loadRecipes } from '@/game/recipe'

import './styles/main.scss'

await loadRecipes()
createApp(App).mount('#app')
