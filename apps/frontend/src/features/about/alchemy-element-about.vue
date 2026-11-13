<template>
  <drawer
    v-model="isOpen"
    min-width="65%"
  >
    <template v-if="activeElement">
      <drawer-header>
        Об элементе
      </drawer-header>
      <drawer-body>
        <div class="container">
          <div class="info">
            <h2>{{ activeElement.name }}</h2>
            <img
              class="image"
              :src="spriteUrl(activeElement.id)"
            >
            <p class="description">
              {{ activeElement.description }}
            </p>
          </div>

          <div v-if="activeElement.recipes.length">
            <h2>Доступные рецепты</h2>
            <div
              v-for="(recipe, index) of activeElement.recipes"
              :key="index"
              class="recipe"
            >
              <div
                class="element"
                @click="game.session.about.open(recipe[0])"
              >
                <alchemy-item :element="recipe[0]" />
              </div>
              <span class="plus">+</span>
              <div
                class="element"
                @click="game.session.about.open(recipe[1])"
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
import Drawer from '@/shared/ui/drawer/drawer.vue'
import AlchemyItem from '@/shared/ui/alchemy-item.vue'
import DrawerBody from '@/shared/ui/drawer/drawer-body.vue'
import DrawerHeader from '@/shared/ui/drawer/drawer-header.vue'
import { useGame } from '@/game/injection'
import { spriteUrl } from '@/assets/sprite'

const game = useGame()
const isOpen = game.session.about.isOpen
const activeElement = game.session.about.activeElement
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
