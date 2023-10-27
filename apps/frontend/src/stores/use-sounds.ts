import { defineStore } from 'pinia'

export const useSounds = defineStore('sounds', () => {
  const createAudio = new Audio('/sounds/create.mp3')
  createAudio.volume = 0.2

  const createNewAudio = new Audio('/sounds/create-new.mp3')
  createNewAudio.volume = 0.3

  const takingAudio = new Audio('/sounds/taking.mp3')
  takingAudio.volume = 0.5

  return {
    createAudio,
    createNewAudio,
    takingAudio
  }
})
