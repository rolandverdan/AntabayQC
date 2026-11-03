import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import usePopover from './usePopover.js'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const pad = (n) => String(n).padStart(2, '0')
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export function fromISO(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '')
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}
const fmt = (d) => `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`

/**
 * Custom calendar picker (blue theme). Value is an ISO "YYYY-MM-DD" string, same as <input type="date">.
 *   <DatePicker value={v} onChange={(e) => set(e.target.value)} min max required />
 */
export default function DatePicker({ value, onChange, min, max, required = false, disabled = false, className = '', wrapperClassName = '', id, name, placeholder = 'Select date', 'aria-label': ariaLabel }) {
  const selected = fromISO(value)
  const today = new Date()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => selected || today)
  const listId = useId()
  const close = useCallback(() => setOpen(false), [])
  const { triggerRef, panelRef, style } = usePopover({ open, onClose: close, minWidth: 288, maxHeight: 420 })
  const minD = fromISO(min)
  const maxD = fromISO(max)

  useEffect(() => { if (open) setView(selected || today) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open])

  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1)
    const start = new Date(first); start.setDate(1 - first.getDay())
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
  }, [view])

  const blocked = (d) => (minD && d < minD) || (maxD && d > maxD)
  const set = (d) => { onChange?.({ target: { value: d ? toISO(d) : '', name, id } }); close(); triggerRef.current?.focus() }
  const shiftMonth = (n) => setView((v) => new Date(v.getFullYear(), v.getMonth() + n, 1))
  const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  return (
    <div className={`relative ${wrapperClassName}`}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={`flex min-h-10 w-full items-center gap-2 rounded-lg border ${/\bbg-/.test(className) ? '' : 'bg-white'} px-3 py-2 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-brand/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 [@media(pointer:coarse)]:min-h-[44px] ${open ? 'border-brand ring-2 ring-brand/20' : `${/\bborder-/.test(className) ? '' : 'border-slate-300'} focus-visible:border-brand`} ${selected ? 'text-slate-800' : 'text-slate-400'} ${className}`}
      >
        <CalendarDays size={16} className="shrink-0 text-brand" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{selected ? fmt(selected) : placeholder}</span>
      </button>
      {required && <input tabIndex={-1} aria-hidden="true" required value={value || ''} onChange={() => {}} className="pointer-events-none absolute inset-0 h-full w-full opacity-0" />}

      {open && createPortal(
        <div ref={panelRef} id={listId} role="dialog" aria-label="Choose date" style={style} className="z-[1300] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-brand/10 hover:text-brand"><ChevronLeft size={16} /></button>
            <p className="text-sm font-bold text-brand" aria-live="polite">{MONTHS[view.getMonth()]} {view.getFullYear()}</p>
            <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-brand/10 hover:text-brand"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 text-center">
            {DAYS.map((d) => <span key={d} className="py-1.5 text-[11px] font-semibold text-slate-500">{d}</span>)}
            {cells.map((d) => {
              const inMonth = d.getMonth() === view.getMonth()
              const isSel = sameDay(d, selected)
              const isToday = sameDay(d, today)
              const off = blocked(d)
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  disabled={off}
                  onClick={() => set(d)}
                  aria-label={fmt(d)}
                  aria-pressed={isSel}
                  className={`mx-auto my-0.5 flex h-9 w-9 items-center justify-center rounded-lg text-sm transition disabled:cursor-not-allowed disabled:opacity-30 ${
                    isSel ? 'bg-brand font-bold text-white shadow-sm'
                      : isToday ? 'border border-brand font-semibold text-brand hover:bg-brand/10'
                        : inMonth ? 'text-slate-800 hover:bg-brand/10' : 'text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2.5">
            <button type="button" onClick={() => set(null)} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100">Clear</button>
            <button type="button" disabled={blocked(today)} onClick={() => set(today)} className="rounded-md px-2 py-1 text-xs font-semibold text-brand hover:bg-brand/10 disabled:opacity-40">Today</button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
