<script setup lang="ts">
import { useGame } from '@/stores/use-game'
import { useGuide } from '@/stores/use-guide'
import { useSettings } from '@/stores/use-settings'
import Drawer from '@/ui/drawer/drawer.vue'
import DrawerBody from '@/ui/drawer/drawer-body.vue'
import DrawerHeader from '@/ui/drawer/drawer-header.vue'
import { storeToRefs } from 'pinia'

const guideStore = useGuide()
const gameStore = useGame()
const settingsStore = useSettings()
const { settings } = storeToRefs(settingsStore)
</script>

<template>
  <Drawer
    v-model="guideStore.isOpen"
    min-width="65%"
    :ignore-element="['#toggle-guide']"
  >
    <DrawerHeader>
      Об игре
    </DrawerHeader>
    <DrawerBody>
      <div class="guide">
        <h1>Настройки</h1>
        <div>
          <h3 class="title">
            Громкость звука
          </h3>
          <input
            v-model.number="settings.volume"
            type="range"
            min="0"
            max="100"
            step="1"
          >

          <h3 class="title">
            Размер элементов
          </h3>
          <input
            v-model.number="settings.elementSize"
            type="range"
            min="25"
            max="100"
            step="1"
          >
          <h3 class="title">
            <label>
              <input v-model="settings.hideEndedElements" type="checkbox">
              Скрыть завершенные элементы
            </label>
          </h3>

          <div class="button-group">
            <button class="button-group__item settings" @click="settingsStore.$reset">
              Сбросить настройки
            </button>
            <button class="button-group__item game" @click="gameStore.$reset">
              Начать новую игру
            </button>
          </div>
        </div>

        <h1>Инструкция</h1>

        <div>
          <h2 class="title">
            Создание элементов
          </h2>
          <p class="description">
            Создавайте новые элементы, <b class="marker">комбинируя элементы друг с другом.</b> У одного элемента может быть <b class="marker">несколько рецептов.</b> Один элемент может использоваться в создании нескольких элементов.
          </p>
          <p class="description">
            Чтобы добавить уже созданный элемент на поле, <b class="marker">нажмите на него правой кнопкой мыши или зажмите правую кнопку мыши и перетащите его на поле.</b>
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
            Не забывайте читать описания элементов. В них может содержаться подсказка для создания другого элемента. Для отрытия справки, <b class="marker">нажмите левой кнопкой мыши по элементу в каталоге.</b>
          </p>
          <p class="description">
            Символ <b class="marker" style="color: tomato;">*</b> около элемента означает, что <b class="marker">данный элемент конечный и не участвует в создании других элементов.</b>
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
            Чтобы удалить элемент, <b class="marker">кликните по нему правой кнопкой мыши или воспользуйтесь опцией "Очистить поле".</b>
          </p>
        </div>
      </div>
    </DrawerBody>
  </Drawer>
</template>

<style scoped lang="scss">
.guide {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.description {
  text-align: justify;
  font-size: 18px;
}

.description + .description {
  margin-top: 12px;
}

.marker {
  font-weight: bold;
}

.button-group {
  display: flex;
  gap: 8px;

  &__item {
    color: var(--vt-c-white);
    cursor: pointer;
    border: none;
    padding: 12px;
    border-radius: 12px;
    margin-top: 1rem;
    font-size: medium;
    transition: background-color 0.2s ease-in-out;

    &.settings {
      background-color: var(--vt-c-success);
    }

    &.game {
      background-color: var(--vt-c-danger);
    }
  }
}
</style>
