import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

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

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000/api',
        changeOrigin: true,
        configure: configurationByType.base,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  plugins: [
    vue(),
    viteSingleFile(),
    replaceSvgUrl(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    modulePreload: false,
    terserOptions: {
      format: {
        comments: false
      }
    }
  },
})

function replaceSvgUrl(): Plugin {
  const urls = [
    'https://vuejs.org/error',
    'http://www.w3.org/2000/svg',
    'http://www.w3.org/1998/Math/MathML',
    'http://www.w3.org/1999/xlink',
  ]

  function createUrlReplacer(url: string) {
    const regexp = new RegExp(url, 'g')
    const base64 = btoa(url)
    const variableName = url.split('/').at(-1)
    const code = `const __${variableName}__ = atob('${base64}');`
    return {
      variableName,
      regexp,
      code
    }
  }

  return {
    name: 'vite:replace-svg-url',
    apply: 'build',
    generateBundle(_, bundle) {
      for (const bundleIndex in bundle) {
        const file = bundle[bundleIndex]
        if (file.type === 'chunk') {
          const replacers = []
          for (const url of urls) {
            replacers.push(createUrlReplacer(url))
          }

          let replacedFile = file.code
          for (const replacer of replacers) {
            replacedFile = replacedFile
              .replaceAll(replacer.regexp, `"+__${replacer.variableName}__+"`)
          }

          file.code = replacers.map((replacer) => replacer.code).join('') + replacedFile
        }
      }
    }
  }
}
