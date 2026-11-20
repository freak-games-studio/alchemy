<template>
  <alchemy-panel
    :open="active === 'guide'"
    scroll
    @close="shell.close()"
  >
    <template #heading>
      <span class="h6">Справочник</span>
    </template>
    <div class="guide">
      <div>
        <h2 class="guide__title">
          Создание элементов
        </h2>
        <p class="guide__description">
          Создавайте новые элементы, <b class="guide__marker">комбинируя элементы друг с другом.</b> У одного элемента может быть <b class="guide__marker">несколько рецептов.</b> Один элемент может использоваться в создании нескольких элементов.
        </p>
        <p class="guide__description">
          Чтобы добавить уже созданный элемент на поле, откройте <b class="guide__marker">«Элементы»</b> на панели и <b class="guide__marker">нажмите на него или перетащите на стол.</b>
        </p>
        <p class="guide__description">
          <b class="guide__marker">Двойное нажатие по пустой области на поле</b> создаст четыре базовых элемента.
        </p>
      </div>

      <div>
        <h2 class="guide__title">
          Просмотр информации об элементе
        </h2>
        <p class="guide__description">
          Не забывайте читать описания элементов. В них может содержаться подсказка для создания другого элемента. Для открытия справки <b class="guide__marker">нажмите правой кнопкой мыши или удерживайте элемент в списке «Элементы».</b>
        </p>
        <p class="guide__description">
          Символ <b class="guide__marker guide__marker--ended">*</b> около элемента означает, что <b class="guide__marker">данный элемент конечный и не участвует в создании других элементов.</b>
        </p>
      </div>

      <div>
        <h2 class="guide__title">
          Копирование элементов
        </h2>
        <p class="guide__description">
          Чтобы скопировать элемент, кликните по нему два раза.
        </p>
      </div>

      <div>
        <h2 class="guide__title">
          Удаление элементов
        </h2>
        <p class="guide__description">
          Чтобы удалить элемент на поле, <b class="guide__marker">нажмите по нему правой кнопкой мыши или удерживайте его.</b> Кнопка <b class="guide__marker">«Очистить»</b> на панели убирает всё, кроме базовых элементов.
        </p>
      </div>
    </div>
  </alchemy-panel>
</template>

<script setup lang="ts">
import AlchemyPanel from '@/shared/ui/alchemy-panel.vue'
import { useGame } from '@/game/injection'

const shell = useGame().session.shell
const active = shell.active
</script>

<style scoped lang="scss">
.guide {
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: var(--muted-foreground);

  &__title {
    color: var(--foreground);
  }

  &__description {
    font-size: 18px;
    text-align: justify;

    & + & {
      margin-top: 12px;
    }
  }

  &__marker {
    font-weight: bold;

    &--ended {
      color: var(--primary);
    }
  }
}
</style>
