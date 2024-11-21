import { SOUND_FILES } from '@/assets/sounds'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { useSettings } from './use-settings'

export const useSounds = defineStore('sounds', () => {
  const { settings } = storeToRefs(useSettings())

  const sounds = new Map<string, HTMLAudioElement>()
  function playSound(sound: keyof typeof SOUND_FILES) {
    const audio = sounds.get(sound)
    if (!audio) return
    audio.volume = settings.value.volume / 100
    if (audio.volume === 0) return
    audio.currentTime = 0
    audio.play()
  }

  onMounted(() => {
    for (const [key, value] of Object.entries(SOUND_FILES)) {
      const audio = new Audio(value)
      audio.preload = 'auto'
      audio.load()
      sounds.set(key, audio)
    }
  })

  return {
    playSound,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSounds, import.meta.hot))
}
