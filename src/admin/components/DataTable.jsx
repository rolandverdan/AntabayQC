import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { useAdminData } from '../context/AdminDataContext.jsx'

/** columns: [{ key, header, render?: (row) => node, className? }] */
export default function DataTable({ columns, rows, rowKey = 'id', pageSize, emptyTitle = 'No records found', emptyHint = 'Try changing your search or filters.', rowClassName }) {
  const { settings } = useAdminData()
  const size = pageSize || settings.pageSize || 8
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(rows.length / size))
  const current = Math.min(page, pages)

  useEffect(() => setPage(1), [rows.length])

  const start = (current - 1) * size
  const slice = rows.slice(start, start + size)
  const windowStart = Math.max(1, Math.min(current - 2, pages - 4))
  const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => windowStart + i)

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="admin-table min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`whitespace-nowrap font-semibold ${c.className || ''}`}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slice.map((row) => (
              <tr key={row[rowKey]} className={`hover:bg-slate-50/70 ${rowClassName ? rowClassName(row) : ''}`}>
                {columns.map((c) => (
                  <td key={c.key} className={`align-middle text-slate-700 ${c.className || ''}`}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="flex flex-col items-center gap-1 px-4 py-12 text-center">
          <Inbox className="text-slate-300" size={36} />
          <p className="text-sm font-semibold text-navy">{emptyTitle}</p>
          <p className="text-xs text-slate-500">{emptyHint}</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row">
          <p>
            Showing {start + 1}–{Math.min(start + size, rows.length)} of {rows.length}
          </p>
          <div className="flex items-center gap-1">
            <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Previous page" className="rounded-md p-1.5 hover:bg-slate-100 disabled:opacity-40">
              <ChevronLeft size={16} />
            </button>
            {nums.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={`h-7 min-w-7 rounded-md px-2 font-semibold ${n === current ? 'bg-brand text-white' : 'hover:bg-slate-100'}`}
              >
                {n}
              </button>
            ))}
            <button type="button" disabled={current === pages} onClick={() => setPage(current + 1)} aria-label="Next page" className="rounded-md p-1.5 hover:bg-slate-100 disabled:opacity-40">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
