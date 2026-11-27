import { reactive } from 'vue'

const spriteRevision = reactive<Record<string, number>>({})

export function spriteUrl(id: string): string {
  const revision = spriteRevision[id]
  const base = `${import.meta.env.BASE_URL}sprites/${id}.webp`
  return revision
    ? `${base}?v=${revision}`
    : base
}

export function touchSprite(id: string) {
  spriteRevision[id] = Date.now()
}
