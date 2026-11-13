<template>
  <div class="drawer-body">
    <slot />
  </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.drawer-body {
  flex: auto;
  padding: 24px;
  overflow: auto;
}
</style>
