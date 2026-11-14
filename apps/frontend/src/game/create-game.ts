import { watch } from 'vue'

import { createAudio } from './audio'
import { createBoard } from './board'
import { createToast } from './toast'
import { createCatalog } from './catalog'
import { createSession } from './session'
import { createStarters } from './recipe'
import { createSettings } from './settings'
import type { AudioApi } from './audio'
import type { BoardApi } from './board'
import type { ToastApi } from './toast'
import type { CatalogApi } from './catalog'
import type { SessionApi } from './session'
import type { SettingsApi } from './settings'
import type { AlchemyElementOnBoard } from './element'

export interface Game {
  settings: SettingsApi
  audio: AudioApi
  board: BoardApi
  catalog: CatalogApi
  session: SessionApi
  toast: ToastApi
  startNew: () => void
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
  const toast = createToast()
  const board = createBoard(settings, audio, { catalog, toast })
  const session = createSession(catalog)

  watch(board.boardSize, (size) => {
    if (size.bottom === 0 || board.basics.value.length > 0) return

    board.basics.value = createStarters(size, settings.values.value.elementSize)
    if (board.items.value.length === 0) {
      board.items.value = copyElements(board.basics.value)
    }
    catalog.seed(board.basics.value)
  })

  function startNew() {
    board.clear()
    catalog.reset()
    catalog.seed(board.basics.value)
  }

  return {
    settings,
    audio,
    board,
    catalog,
    session,
    toast,
    startNew,
  }
}
