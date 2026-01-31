export function parseRollList(raw) {
  if (raw == null) return []
  const text = String(raw).trim()
  if (!text) return []

  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function uniq(arr) {
  return Array.from(new Set(arr))
}
