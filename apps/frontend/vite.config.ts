import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { HttpProxy } from 'vite'

type ProxyLogType = 'none' | 'base' | 'all'

const configurationByType: Record<ProxyLogType, (proxy: HttpProxy.Server) => void> = {
  all: (proxy: HttpProxy.Server) => {
    proxy.on('error', (err) => {
      console.log('proxy error', err)
    })
    proxy.on('proxyReq', (proxyReq, req) => {
      console.log(
        'proxy:',
        req.method,
        req.url,
        ' ==> ',
        `${proxyReq.method}  ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`,
        JSON.stringify(proxyReq.getHeaders(), null, '  '),
      )
    })
    proxy.on('proxyRes', (proxyRes, req) => {
      console.log(
        'proxy result:',
        proxyRes.statusCode,
        req.url,
        JSON.stringify(proxyRes.headers, null, '  '),
      )
    })
  },
  none: () => {},
  base: (proxy: HttpProxy.Server) => {
    proxy.on('error', (err) => {
      console.log('proxy error', err)
    })
    proxy.on('proxyReq', (proxyReq, req) => {
      console.log(
        'proxy: ',
        req.method,
        req.url,
        ' ==> ',
        `${proxyReq.method}  ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`,
      )
    })
    proxy.on('proxyRes', (proxyRes, req) => {
      console.log('proxy result:', proxyRes.statusCode, req.url)
    })
  },
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000/api',
        changeOrigin: true,
        configure: configurationByType.base,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  base: './',
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
