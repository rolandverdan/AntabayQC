export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })

export const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-PH', { dateStyle: 'medium' })

/** Next id such as BUS-109: finds the highest trailing number and adds one. */
export function nextId(prefix, items, pad = 3) {
  const max = items.reduce((m, it) => {
    const match = /(\d+)$/.exec(it.id)
    return match ? Math.max(m, parseInt(match[1], 10)) : m
  }, 0)
  return `${prefix}-${String(max + 1).padStart(pad, '0')}`
}

/** Stable readable IDs for list views backed by records with random document IDs. */
export function sequentialDisplayIds(items, prefix, dateKey, pad = 4) {
  const millis = (value) => {
    const date = value?.toDate ? value.toDate() : new Date(value || 0)
    const time = date.getTime()
    return Number.isFinite(time) ? time : 0
  }
  const ordered = [...items].sort((a, b) =>
    millis(a[dateKey]) - millis(b[dateKey]) || String(a.id).localeCompare(String(b.id)),
  )
  return new Map(ordered.map((item, index) => [item.id, `${prefix}-${String(index + 1).padStart(pad, '0')}`]))
}

/** from / to are 'YYYY-MM-DD' strings from <input type="date"> (either may be empty). */
export function inDateRange(iso, from, to) {
  const t = new Date(iso).getTime()
  if (from && t < new Date(`${from}T00:00:00`).getTime()) return false
  if (to && t > new Date(`${to}T23:59:59`).getTime()) return false
  return true
}

export const includesText = (haystack, needle) =>
  haystack.join(' ').toLowerCase().includes(needle.trim().toLowerCase())
