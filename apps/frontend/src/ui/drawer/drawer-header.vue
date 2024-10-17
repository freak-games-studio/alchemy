<template>
  <div class="drawer-header">
    <span class="h6">
      <slot />
    </span>
    <img
      class="drawer-header__close"
      :src="XIcon"
      @click="toggleDrawer"
    />
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { drawerInjectionKey } from './drawer-injection-key'
import XIcon from '@/assets/x.svg'

const { toggleDrawer } = inject(drawerInjectionKey)!
</script>

<style scoped lang="scss">
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--vt-c-divider-dark-2);

  &__close {
    width: 24px;
    height: 24px;
    cursor: pointer;
  }
}

.h6 {
  font-size: 20px;
  line-height: 32px;
  font-weight: 600;
}
</style>
