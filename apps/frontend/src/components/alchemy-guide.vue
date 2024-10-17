<script setup lang="ts">
import Drawer from '@/ui/drawer/drawer.vue'
import DrawerBody from '@/ui/drawer/drawer-body.vue'
import DrawerHeader from '@/ui/drawer/drawer-header.vue'
import { useDrawer } from '@/stores/use-drawer'
import { storeToRefs } from 'pinia'
import { sprites } from '@/assets/sprites'

const { isOpen, openedElement } = storeToRefs(useDrawer())
</script>

<template>
  <Drawer v-model="isOpen" min-width="40%">
    <template v-if="openedElement">
      <DrawerHeader>
        Об элементе
      </DrawerHeader>
      <DrawerBody>
        <div class="element">
          <h2>{{ openedElement.name }}</h2>
          <img class="element-image" :src="sprites[openedElement.id]" />
          <p class="element-description">{{ openedElement.description }}</p>
        </div>
      </DrawerBody>
    </template>
  </Drawer>
</template>

<style scoped lang="scss">
.element {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-direction: column;

  &-image {
    height: 120px;
    width: 120px;
  }

  &-description {
    text-align: justify;
    font-size: 18px;
  }
}
</style>
