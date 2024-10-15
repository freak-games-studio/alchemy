import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './app.vue'
import { splashScreen } from './splash-screen'
import './styles/main.scss'

splashScreen.init()
splashScreen.onInit(() => {
  createApp(App)
    .use(createPinia())
    .mount('#app')
})
