import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './app.vue'
import './styles/main.scss'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
