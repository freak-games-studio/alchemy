<template>
  <div
    v-if="activeElement"
    class="about"
  >
    <div class="info">
      <img
        class="image"
        :src="spriteUrl(activeElement.id)"
        alt=""
      >
      <p class="description">
        {{ activeElement.description }}
      </p>
    </div>

    <div
      v-if="activeElement.recipes.length"
      class="recipes"
    >
      <h2 class="recipes-title">
        Доступные рецепты
      </h2>
      <div
        v-for="(recipe, index) of activeElement.recipes"
        :key="index"
        class="recipe"
      >
        <div
          class="element"
          @click="about.open(recipe[0])"
        >
          <alchemy-item :element="recipe[0]" />
        </div>
        <span class="plus">+</span>
        <div
          class="element"
          @click="about.open(recipe[1])"
        >
          <alchemy-item :element="recipe[1]" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AlchemyItem from '@/shared/ui/alchemy-item.vue'
import { useGame } from '@/game/injection'
import { spriteUrl } from '@/assets/sprite'

const about = useGame().session.about
const activeElement = about.current
</script>

<style scoped lang="scss">
.about {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 20px;
  padding: 16px 16px 20px;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}

.info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.image {
  width: 72px;
  height: 72px;
}

.description {
  color: var(--muted-foreground);
  font-size: 16px;
  line-height: 1.5;
  text-align: left;
}

.recipes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recipes-title {
  color: var(--foreground);
  font-weight: 600;
  font-size: 16px;
  line-height: 1.3;
}

.recipe {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
}

.plus {
  flex-shrink: 0;
  color: var(--foreground);
  font-weight: 600;
  font-size: 28px;
  line-height: 1;
}

.element {
  cursor: pointer;
  border-radius: 12px;
}

.element:hover {
  background: color-mix(in srgb, var(--primary) 10%, transparent);
}
</style>
