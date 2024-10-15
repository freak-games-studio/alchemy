import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './app.vue'
import './styles/main.scss'

createApp(App)
  .use(createPinia())
  .mount('#app')
