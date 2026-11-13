import type { InjectionKey, Ref } from 'vue'

interface DrawerContext {
  isOpen: Ref<boolean>
  toggleDrawer: () => void
}

export const drawerInjectionKey = Symbol('drawer') as InjectionKey<DrawerContext>
