import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

import { recipesDevPlugin } from './vite/recipes-dev.js'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    recipesDevPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
