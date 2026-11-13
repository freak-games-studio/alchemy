<template>
  <div class="drawer-footer">
    <slot />
  </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.drawer-footer {
  display: flex;
  gap: 8px;
  border-top: 1px solid var(--vt-c-divider-dark-2);
  padding: 16px 24px 16px 24px;
}
</style>
