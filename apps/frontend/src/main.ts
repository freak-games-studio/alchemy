import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './app.vue'
import './main.css'

createApp(App)
  .use(createPinia())
  .mount('#app')
