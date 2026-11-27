import { touchSprite } from '@/assets/sprite'

async function failText(response: Response, fallback: string): Promise<string> {
  const text = (await response.text()).trim()
  return text || fallback
}

export async function saveSprite(id: string, file: File) {
  const response = await fetch(`/__alchemy/sprites/${id}`, {
    method: 'PUT',
    body: file,
  })
  if (!response.ok) throw new Error(await failText(response, 'Не удалось сохранить картинку'))
  touchSprite(id)
}

export async function renameSprite(from: string, to: string) {
  if (from === to) return
  const response = await fetch('/__alchemy/sprites/rename', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ from, to }),
  })
  if (!response.ok) throw new Error(await failText(response, 'Не удалось переименовать картинку'))
  touchSprite(to)
}

export async function removeSprite(id: string) {
  const response = await fetch(`/__alchemy/sprites/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error(await failText(response, 'Не удалось удалить картинку'))
}
