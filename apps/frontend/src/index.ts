import { splashScreen } from './splash-screen'
import '@/styles/splash-screen.scss'

splashScreen.init()
splashScreen.onInit(() => import('./main'))
