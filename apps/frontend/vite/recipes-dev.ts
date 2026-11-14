import { Buffer } from 'node:buffer'
import { fileURLToPath } from 'node:url'
import { rename, writeFile } from 'node:fs/promises'
import type { Plugin, ViteDevServer } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

const recipesFile = fileURLToPath(new URL('../public/recipes.json', import.meta.url))
const bodyLimit = 2_000_000

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer | string) => {
      const buffer = typeof chunk === 'string'
        ? Buffer.from(chunk)
        : chunk
      size += buffer.length
      if (size > bodyLimit) {
        reject(new Error('Слишком большой запрос'))
        req.destroy()
        return
      }
      chunks.push(buffer)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

async function writeRecipes(server: ViteDevServer, req: IncomingMessage, res: ServerResponse) {
  try {
    const raw = await readBody(req)
    const parsed: unknown = JSON.parse(raw)
    const loaded = await server.ssrLoadModule('/src/features/recipe-editor/validate.ts') as {
      serializeRecipes: (input: unknown) => { body: string } | { error: string }
    }
    const result = loaded.serializeRecipes(parsed)
    if ('error' in result) {
      res.statusCode = 400
      res.end(result.error)
      return
    }
    const temporary = `${recipesFile}.tmp`
    await writeFile(temporary, result.body)
    await rename(temporary, recipesFile)
    res.statusCode = 204
    res.end()
  } catch (cause) {
    if (res.writableEnded) return
    res.statusCode = 400
    res.end(cause instanceof Error
      ? cause.message
      : 'Не удалось сохранить')
  }
}

export function recipesDevPlugin(): Plugin {
  return {
    name: 'alchemy-recipes',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__alchemy/recipes', (req, res, next) => {
        if (req.method !== 'PUT') {
          next()
          return
        }
        writeRecipes(server, req, res)
      })
    },
  }
}
