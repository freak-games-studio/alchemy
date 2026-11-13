import { watch } from 'vue'

import { createAudio } from './audio'
import { createBoard } from './board'
import { createCatalog } from './catalog'
import { createSession } from './session'
import { createStarters } from './recipe'
import { createSettings } from './settings'
import type { AudioApi } from './audio'
import type { BoardApi } from './board'
import type { CatalogApi } from './catalog'
import type { SessionApi } from './session'
import type { SettingsApi } from './settings'
import type { AlchemyElement, AlchemyElementOnBoard } from './element'

export interface Game {
  settings: SettingsApi
  audio: AudioApi
  board: BoardApi
  catalog: CatalogApi
  session: SessionApi
  startNew: () => void
  activateCheat: (event: DragEvent) => void
}

function copyElements(elements: AlchemyElementOnBoard[]): AlchemyElementOnBoard[] {
  return elements.map(element => ({
    ...element,
    position: { ...element.position },
  }))
}

export function createGame(): Game {
  const settings = createSettings()
  const audio = createAudio(settings)
  const catalog = createCatalog(audio)
  const board = createBoard(settings, audio, catalog)
  const session = createSession(catalog)

  watch(board.boardSize, (size) => {
    if (size.bottom === 0) return

    board.basics.value = createStarters(size, settings.values.value.elementSize)
    if (board.items.value.length === 0) {
      board.items.value = copyElements(board.basics.value)
    }
    catalog.seed(board.basics.value)
  })

  function startNew() {
    // eslint-disable-next-line no-alert
    const isConfirm = confirm('Вы точно хотите начать новую игру?')
    if (!isConfirm) return

    board.clear()
    catalog.reset()
    catalog.seed(board.basics.value)
  }

  function activateCheat(event: DragEvent) {
    if (!event.dataTransfer) return
    event.preventDefault()

    const elementData = JSON.parse(event.dataTransfer.getData('text/plain')) as {
      element: AlchemyElement
    }
    if (!elementData) return
    if (elementData.element.id !== 'vodka') return

    // eslint-disable-next-line no-alert
    const isConfirm = confirm('ТЫ ЧЕ ПЬЯНЫЙ!?')
    if (!isConfirm) return

    catalog.unlockAll()
  }

  return {
    settings,
    audio,
    board,
    catalog,
    session,
    startNew,
    activateCheat,
  }
}
