<template>
  <div
    v-if="activeElement"
    class="about"
  >
    <div class="about__info">
      <img
        class="about__image"
        :src="spriteUrl(activeElement.id)"
        alt=""
      >
      <p class="about__description">
        {{ activeElement.description }}
      </p>
    </div>

    <div
      v-if="activeElement.recipes.length"
      class="about__recipes"
    >
      <h2 class="about__recipes-title">
        Доступные рецепты
      </h2>
      <div
        v-for="(recipe, index) of activeElement.recipes"
        :key="index"
        class="about__recipe"
      >
        <div
          class="about__element"
          @click="about.open(recipe[0])"
        >
          <alchemy-item
            :element="recipe[0]"
            :size="elementSize"
          />
        </div>
        <span class="about__plus">+</span>
        <div
          class="about__element"
          @click="about.open(recipe[1])"
        >
          <alchemy-item
            :element="recipe[1]"
            :size="elementSize"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AlchemyItem from '@/shared/ui/alchemy-item.vue'
import { useGame } from '@/game/injection'
import { spriteUrl } from '@/assets/sprite'

const game = useGame()
const about = game.session.about
const activeElement = about.current
const elementSize = game.board.elementSize
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

  &__info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  &__image {
    width: 72px;
    height: 72px;
  }

  &__description {
    color: var(--muted-foreground);
    font-size: 16px;
    line-height: 1.5;
    text-align: left;
  }

  &__recipes {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__recipes-title {
    color: var(--foreground);
    font-weight: 600;
    font-size: 16px;
    line-height: 1.3;
  }

  &__recipe {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 4px;
  }

  &__plus {
    flex-shrink: 0;
    color: var(--foreground);
    font-weight: 600;
    font-size: 28px;
    line-height: 1;
  }

  &__element {
    cursor: pointer;
    border-radius: 12px;

    &:hover {
      background: color-mix(in srgb, var(--primary) 10%, transparent);
    }
  }
}
</style>
