<template>
  <div class="drawer-header">
    <span class="h6">
      <slot />
    </span>
    <img
      class="drawer-header__close"
      src="/x.svg"
      @click="toggleDrawer"
    >
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'

import { drawerInjectionKey } from './drawer-injection-key'

const { toggleDrawer } = inject(drawerInjectionKey)!
</script>

<style scoped lang="scss">
.drawer-header {
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  border-bottom: 1px solid var(--vt-c-divider-dark-2);
  padding: 0 24px;
  height: 52px;

  &__close {
    cursor: pointer;
    width: 24px;
    height: 24px;
  }
}
</style>
