export function parseISODateOnly(dateStr) {
  if (!dateStr) return null
  const d = new Date(`${dateStr}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) return null
  return d
}

export function getMonthRange(monthStr) {
  const [y, m] = String(monthStr || '').split('-').map((v) => Number(v))
  if (!y || !m) return null

  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0))
  return { start, end }
}
