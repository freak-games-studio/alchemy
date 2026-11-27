import sharp from 'sharp'
import { Buffer } from 'node:buffer'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createReadStream } from 'node:fs'
import { rename, stat, unlink, writeFile } from 'node:fs/promises'
import type { Plugin, ViteDevServer } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

const recipesFile = fileURLToPath(new URL('../public/recipes.json', import.meta.url))
const spritesDir = join(dirname(recipesFile), 'sprites')
const bodyLimit = 2_000_000
const spriteLimit = 12_000_000
const spriteSize = 120
const idPattern = /^[a-z0-9_]+$/

function readBytes(req: IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer | string) => {
      const buffer = typeof chunk === 'string'
        ? Buffer.from(chunk)
        : chunk
      size += buffer.length
      if (size > limit) {
        reject(new Error('Слишком большой запрос'))
        req.destroy()
        return
      }
      chunks.push(buffer)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function readBody(req: IncomingMessage): Promise<string> {
  return readBytes(req, bodyLimit).then(buffer => buffer.toString('utf8'))
}

function requestPath(req: IncomingMessage): string {
  const url = (req.url ?? '').split('?')[0] ?? ''
  const marker = '/__alchemy/sprites'
  const index = url.indexOf(marker)
  if (index >= 0) return url.slice(index + marker.length) || '/'
  return url || '/'
}

function spriteId(path: string): string {
  const id = decodeURIComponent(path.replace(/^\//, ''))
  if (!idPattern.test(id)) throw new Error('Некорректный id')
  return id
}

function spriteFile(id: string): string {
  return join(spritesDir, `${id}.webp`)
}

function missing(cause: unknown): boolean {
  return typeof cause === 'object'
    && cause !== null
    && 'code' in cause
    && cause.code === 'ENOENT'
}

function fail(res: ServerResponse, cause: unknown) {
  if (res.writableEnded) return
  res.statusCode = 400
  res.end(cause instanceof Error
    ? cause.message
    : 'Не удалось сохранить')
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
    fail(res, cause)
  }
}

async function encodeSprite(bytes: Buffer): Promise<Buffer> {
  try {
    return await sharp(bytes)
      .resize(spriteSize, spriteSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ lossless: true })
      .toBuffer()
  } catch {
    throw new Error('Не удалось прочитать картинку')
  }
}

async function writeSprite(req: IncomingMessage, res: ServerResponse) {
  try {
    const id = spriteId(requestPath(req))
    const bytes = await readBytes(req, spriteLimit)
    if (!bytes.length) throw new Error('Пустой файл')
    const target = spriteFile(id)
    const temporary = `${target}.tmp`
    await writeFile(temporary, await encodeSprite(bytes))
    await rename(temporary, target)
    res.statusCode = 204
    res.end()
  } catch (cause) {
    fail(res, cause)
  }
}

async function moveSprite(req: IncomingMessage, res: ServerResponse) {
  try {
    const parsed: unknown = JSON.parse(await readBody(req))
    if (!parsed || typeof parsed !== 'object') throw new Error('Некорректный запрос')
    const record = parsed as { from?: unknown, to?: unknown }
    if (typeof record.from !== 'string' || typeof record.to !== 'string') throw new TypeError('Некорректный id')
    const from = record.from
    const to = record.to
    if (!idPattern.test(from) || !idPattern.test(to)) throw new Error('Некорректный id')
    if (from !== to) {
      try {
        await rename(spriteFile(from), spriteFile(to))
      } catch (cause) {
        if (!missing(cause)) throw cause
      }
    }
    res.statusCode = 204
    res.end()
  } catch (cause) {
    fail(res, cause)
  }
}

function spriteRequestId(req: IncomingMessage): string | null {
  const name = requestPath(req).split('/').pop() ?? ''
  if (!name.endsWith('.webp')) return null
  const id = name.slice(0, -'.webp'.length)
  if (!idPattern.test(id)) return null
  return id
}

async function readSprite(req: IncomingMessage, res: ServerResponse, next: () => void) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    next()
    return
  }
  const id = spriteRequestId(req)
  if (!id) {
    next()
    return
  }
  try {
    const info = await stat(spriteFile(id))
    if (!info.isFile()) {
      next()
      return
    }
    res.statusCode = 200
    res.setHeader('Content-Type', 'image/webp')
    res.setHeader('Content-Length', info.size)
    res.setHeader('Cache-Control', 'no-cache')
    if (req.method === 'HEAD') {
      res.end()
      return
    }
    const stream = createReadStream(spriteFile(id))
    stream.on('error', () => {
      if (!res.writableEnded) res.destroy()
    })
    stream.pipe(res)
  } catch (cause) {
    if (missing(cause)) {
      next()
      return
    }
    fail(res, cause)
  }
}

async function deleteSprite(req: IncomingMessage, res: ServerResponse) {
  try {
    const id = spriteId(requestPath(req))
    try {
      await unlink(spriteFile(id))
    } catch (cause) {
      if (!missing(cause)) throw cause
    }
    res.statusCode = 204
    res.end()
  } catch (cause) {
    fail(res, cause)
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
      server.middlewares.use('/sprites', (req, res, next) => {
        readSprite(req, res, next)
      })
      server.middlewares.use('/__alchemy/sprites', (req, res, next) => {
        const path = requestPath(req)
        if (req.method === 'POST' && path === '/rename') {
          moveSprite(req, res)
          return
        }
        if (req.method === 'PUT' && path.length > 1) {
          writeSprite(req, res)
          return
        }
        if (req.method === 'DELETE' && path.length > 1) {
          deleteSprite(req, res)
          return
        }
        next()
      })
    },
  }
}
