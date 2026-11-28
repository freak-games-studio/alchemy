import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'

import { storageKeys } from './storage'

const frontendRoot = fileURLToPath(new URL('../..', import.meta.url))
const indexHtml = join(frontendRoot, 'index.html')

function sourceFiles(directory: string): string[] {
  const found: string[] = []
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) {
      found.push(...sourceFiles(path))
      continue
    }
    if (path.endsWith('.test.ts')) continue
    if (path.endsWith('.ts') || path.endsWith('.vue') || path.endsWith('.html')) found.push(path)
  }
  return found
}

function sources(): string[] {
  return [
    ...sourceFiles(join(frontendRoot, 'src')),
    ...sourceFiles(join(frontendRoot, 'vite')),
    indexHtml,
  ]
}

function filesMentioning(token: string): string[] {
  return sources().filter(path => readFileSync(path, 'utf8').includes(token)).sort()
}

function filesMentioningLiteral(token: string): string[] {
  const quoted = [`'${token}'`, `"${token}"`, `\`${token}\``]
  return sources().filter((path) => {
    const source = readFileSync(path, 'utf8')
    return quoted.some(form => source.includes(form))
  }).sort()
}

describe('persistence keys', () => {
  it('live in one module, and the boot script uses the settings key', () => {
    const storageFile = fileURLToPath(new URL('./storage.ts', import.meta.url))
    expect(filesMentioningLiteral(storageKeys.settings)).toEqual([indexHtml, storageFile].sort())
    expect(filesMentioningLiteral(storageKeys.board)).toEqual([storageFile])
    expect(filesMentioningLiteral(storageKeys.opened)).toEqual([storageFile])
    expect(filesMentioningLiteral(storageKeys.recipeEditor)).toEqual([storageFile])
    expect(readFileSync(indexHtml, 'utf8')).toContain(`localStorage.getItem('${storageKeys.settings}')`)
  })
})

describe('shared interaction rules', () => {
  it('define a field check and a long-press once', () => {
    expect(filesMentioning('function isField')).toEqual([
      fileURLToPath(new URL('./is-field.ts', import.meta.url)),
    ])
    expect(filesMentioning('const HOLD_MS')).toEqual([
      fileURLToPath(new URL('./hold.ts', import.meta.url)),
    ])
    expect(filesMentioning('const HOLD_CANCEL_PX')).toEqual([
      fileURLToPath(new URL('./hold.ts', import.meta.url)),
    ])
  })
})
