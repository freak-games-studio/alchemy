import { onMounted } from 'vue'

import { SOUND_FILES } from '@/assets/sounds'
import type { SettingsApi } from './settings'

export type SoundName = keyof typeof SOUND_FILES

export interface AudioApi {
  play: (sound: SoundName) => void
}

export function createAudio(settings: SettingsApi): AudioApi {
  const sounds = new Map<SoundName, HTMLAudioElement>()

  function play(sound: SoundName) {
    const audio = sounds.get(sound)
    if (!audio) return

    audio.volume = settings.values.value.volume / 100
    if (audio.volume === 0) return

    audio.currentTime = 0
    audio.play()
  }

  onMounted(() => {
    for (const [key, value] of Object.entries(SOUND_FILES)) {
      const audio = new Audio(value)
      audio.preload = 'auto'
      audio.load()
      sounds.set(key as SoundName, audio)
    }
  })

  return {
    play,
  }
}
