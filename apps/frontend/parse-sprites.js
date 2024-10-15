import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'

const assetsFolder = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), 'src', 'assets')
const assets = await fs.readdir(path.resolve(assetsFolder, 'sprites'), {
  encoding: 'utf-8',
  recursive: true
})

const codeLines = []
for (const asset of assets) {
  codeLines.push(`import ${asset.replace('.webp', '')} from './sprites/${asset}'`)
}

codeLines.push(`\nexport const sprites: Record<string, string> = {
  ${assets.map((asset) => asset.replace('.webp', '')).join(',\n  ')}
}\n`)

await fs.writeFile(
  path.resolve(assetsFolder, 'sprites.ts'),
  codeLines.join('\n'),
  { encoding: 'utf-8' }
)
