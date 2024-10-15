import { defineStore } from 'pinia'
import { sounds } from '@/assets/sounds'
import freakGames from '@/assets/freak-games.mp3'

export const useSounds = defineStore('sounds', () => {
  const freakGamesAudio = new Audio(freakGames)
  freakGamesAudio.volume = 1

  const createAudio = new Audio(sounds.create)
  createAudio.volume = 0.5

  const createNewAudio = new Audio(sounds.create_new)
  createNewAudio.volume = 0.5

  const takingAudio = new Audio(sounds.taking)
  takingAudio.volume = 0.7

  return {
    freakGamesAudio,
    createAudio,
    createNewAudio,
    takingAudio
  }
})
