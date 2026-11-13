<template>
  <drawer
    v-model="elementAbout.isOpen"
    min-width="65%"
  >
    <template v-if="elementAbout.activeElement">
      <drawer-header>
        Об элементе
      </drawer-header>
      <drawer-body>
        <div class="container">
          <div class="info">
            <h2>{{ elementAbout.activeElement.name }}</h2>
            <img
              class="image"
              :src="sprites[elementAbout.activeElement.id]"
            >
            <p class="description">
              {{ elementAbout.activeElement.description }}
            </p>
          </div>

          <div v-if="elementAbout.activeElement.recipes.length">
            <h2>Доступные рецепты</h2>
            <div
              v-for="(recipe, index) of elementAbout.activeElement.recipes"
              :key="index"
              class="recipe"
            >
              <div
                class="element"
                @click="elementAbout.openElementAbout(recipe[0])"
              >
                <alchemy-item :element="recipe[0]" />
              </div>
              <span class="plus">+</span>
              <div
                class="element"
                @click="elementAbout.openElementAbout(recipe[1])"
              >
                <alchemy-item :element="recipe[1]" />
              </div>
            </div>
          </div>
        </div>
      </drawer-body>
    </template>
  </drawer>
</template>

<script setup lang="ts">
import Drawer from '@/ui/drawer/drawer.vue'
import DrawerBody from '@/ui/drawer/drawer-body.vue'
import DrawerHeader from '@/ui/drawer/drawer-header.vue'
import AlchemyItem from './alchemy-item.vue'
import { sprites } from '@/assets/sprites'
import { useElementAbout } from '@/stores/use-element-about'

const elementAbout = useElementAbout()
</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;

  .image {
    width: 120px;
    height: 120px;
  }

  .description {
    font-size: 18px;
    text-align: justify;
  }
}

.recipe {
  display: flex;
  align-items: baseline;

  .plus {
    font-weight: bold;
    font-size: 64px;
  }

  .element {
    cursor: pointer;
  }
}
</style>
