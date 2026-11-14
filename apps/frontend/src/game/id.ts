let next = 0

export function uniqueId(): string {
  next += 1
  return `${Date.now().toString(36)}-${next.toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
