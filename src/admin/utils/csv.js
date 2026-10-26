// Escapes a CSV cell: wraps in quotes when it has commas, quotes or line breaks, and doubles inner quotes.
const esc = (v) => {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const todayStamp = () => new Date().toISOString().slice(0, 10)

/** columns: [{ header, value: (row) => any }]. Generated entirely in the browser (no backend). */
export function downloadCsv(filename, rows, columns) {
  const lines = [columns.map((c) => esc(c.header)).join(',')]
  rows.forEach((r) => lines.push(columns.map((c) => esc(c.value(r))).join(',')))
  const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
