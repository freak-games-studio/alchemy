<template>
  <alchemy-panel
    :open="active === 'guide'"
    scroll
    @close="shell.close()"
  >
    <template #heading>
      <span class="h6 title">Справочник</span>
    </template>
    <div class="guide">
      <div>
        <h2 class="title">
          Создание элементов
        </h2>
        <p class="description">
          Создавайте новые элементы, <b class="marker">комбинируя элементы друг с другом.</b> У одного элемента может быть <b class="marker">несколько рецептов.</b> Один элемент может использоваться в создании нескольких элементов.
        </p>
        <p class="description">
          Чтобы добавить уже созданный элемент на поле, откройте <b class="marker">«Элементы»</b> на панели и <b class="marker">нажмите на него или перетащите на стол.</b>
        </p>
        <p class="description">
          <b class="marker">Двойное нажатие по пустой области на поле</b> создаст четыре базовых элемента.
        </p>
      </div>

      <div>
        <h2 class="title">
          Просмотр информации об элементе
        </h2>
        <p class="description">
          Не забывайте читать описания элементов. В них может содержаться подсказка для создания другого элемента. Для открытия справки <b class="marker">нажмите правой кнопкой мыши или удерживайте элемент в списке «Элементы».</b>
        </p>
        <p class="description">
          Символ <b class="marker ended-mark">*</b> около элемента означает, что <b class="marker">данный элемент конечный и не участвует в создании других элементов.</b>
        </p>
      </div>

      <div>
        <h2 class="title">
          Копирование элементов
        </h2>
        <p class="description">
          Чтобы скопировать элемент, кликните по нему два раза.
        </p>
      </div>

      <div>
        <h2 class="title">
          Удаление элементов
        </h2>
        <p class="description">
          Чтобы удалить элемент на поле, <b class="marker">нажмите по нему правой кнопкой мыши или удерживайте его.</b> Кнопка <b class="marker">«Очистить»</b> на панели убирает всё, кроме базовых элементов.
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
}

.title {
  color: var(--foreground);
}

.description {
  font-size: 18px;
  text-align: justify;
}

.description + .description {
  margin-top: 12px;
}

.marker {
  font-weight: bold;
}

.ended-mark {
  color: var(--primary);
}
</style>
