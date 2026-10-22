const esc = (v) => {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** columns: [{ header, value: (row) => any }] */
export function downloadCsv(filename, rows, columns) {
  const lines = [columns.map((c) => esc(c.header)).join(',')]
  rows.forEach((r) => lines.push(columns.map((c) => esc(c.value(r))).join(',')))
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
