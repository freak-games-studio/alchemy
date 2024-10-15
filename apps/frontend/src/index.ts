import { splashScreen } from './splash-screen'
import '@/styles/splash-screen.scss'

splashScreen.init()
splashScreen.onInit(() => {
  const app = document.querySelector<HTMLElement>('#app')
  if (app) app.style.display = 'block'
  import('./main')
})
