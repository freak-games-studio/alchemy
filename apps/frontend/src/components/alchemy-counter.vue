<template>
  <div class="counter">
    {{ elementsCounter }}
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useOpenedElements } from '@/stores/use-opened-elements'

const { elementsCounter } = storeToRefs(useOpenedElements())
</script>

<style scoped>
.counter {
  position: absolute;
  top: 4px;
  right: 10px;
  z-index: 3;
  pointer-events: none;
  font-size: 18px;
}
</style>
