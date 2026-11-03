import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Clock } from 'lucide-react'
import usePopover from './usePopover.js'

const pad = (n) => String(n).padStart(2, '0')
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

// "HH:MM" (24h, like <input type="time">) <-> { h: 1-12, m, pm }
function parse(v) {
  const m = /^(\d{1,2}):(\d{2})/.exec(v || '')
  if (!m) return null
  const H = Number(m[1])
  return { h: H % 12 === 0 ? 12 : H % 12, m: Number(m[2]), pm: H >= 12 }
}
const build = ({ h, m, pm }) => `${pad((h % 12) + (pm ? 12 : 0))}:${pad(m)}`
const label = (t) => `${pad(t.h)}:${pad(t.m)} ${t.pm ? 'PM' : 'AM'}`

function Column({ title, items, isActive, onPick, format = pad, refKey }) {
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'center' })
  }, [refKey])
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1 text-center text-[11px] font-semibold text-slate-500">{title}</p>
      <ul ref={ref} role="listbox" aria-label={title} className="max-h-44 space-y-0.5 overflow-y-auto pr-0.5">
        {items.map((it) => (
          <li key={it}>
            <button
              type="button"
              role="option"
              aria-selected={isActive(it)}
              onClick={() => onPick(it)}
              className={`flex h-8 w-full items-center justify-center rounded-lg text-sm transition ${isActive(it) ? 'bg-brand font-bold text-white' : 'text-slate-700 hover:bg-brand/10'}`}
            >
              {format(it)}
            </button>
      {required && <input tabIndex={-1} aria-hidden="true" required value={value || ''} onChange={() => {}} className="pointer-events-none absolute inset-0 h-full w-full opacity-0" />}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Custom time picker with separate Hour, Minute and AM/PM columns.
 * Value is "HH:MM" in 24-hour form, same as <input type="time">.
 */
export default function TimePicker({ value, onChange, required = false, disabled = false, className = '', wrapperClassName = '', id, name, placeholder = 'Select time', 'aria-label': ariaLabel }) {
  const parsed = parse(value)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(parsed || { h: 12, m: 0, pm: false })
  const listId = useId()
  const close = useCallback(() => setOpen(false), [])
  const { triggerRef, panelRef, style } = usePopover({ open, onClose: close, minWidth: 256, maxHeight: 380 })

  useEffect(() => { if (open) setDraft(parse(value) || nowDraft()) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open])

  function nowDraft() {
    const d = new Date()
    const m = Math.round(d.getMinutes() / 5) * 5
    return { h: d.getHours() % 12 === 0 ? 12 : d.getHours() % 12, m: m === 60 ? 55 : m, pm: d.getHours() >= 12 }
  }
  const emit = (t) => onChange?.({ target: { value: t ? build(t) : '', name, id } })
  const apply = () => { emit(draft); close(); triggerRef.current?.focus() }

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
        className={`flex min-h-10 w-full items-center gap-2 rounded-lg border ${/\bbg-/.test(className) ? '' : 'bg-white'} px-3 py-2 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-brand/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 [@media(pointer:coarse)]:min-h-[44px] ${open ? 'border-brand ring-2 ring-brand/20' : `${/\bborder-/.test(className) ? '' : 'border-slate-300'} focus-visible:border-brand`} ${parsed ? 'text-slate-800' : 'text-slate-400'} ${className}`}
      >
        <Clock size={16} className="shrink-0 text-brand" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{parsed ? label(parsed) : placeholder}</span>
      </button>

      {open && createPortal(
        <div ref={panelRef} id={listId} role="dialog" aria-label="Choose time" style={style} className="z-[1300] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="flex gap-2">
            <Column title="Hour" items={HOURS} refKey={open} isActive={(h) => h === draft.h} onPick={(h) => setDraft((d) => ({ ...d, h }))} />
            <Column title="Minute" items={MINUTES} refKey={open} isActive={(m) => m === draft.m} onPick={(m) => setDraft((d) => ({ ...d, m }))} />
            <Column title="Period" items={['AM', 'PM']} refKey={open} format={(x) => x} isActive={(p) => (p === 'PM') === draft.pm} onPick={(p) => setDraft((d) => ({ ...d, pm: p === 'PM' }))} />
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2.5">
            <button type="button" onClick={() => setDraft(nowDraft())} className="rounded-md px-2 py-1 text-xs font-semibold text-brand hover:bg-brand/10">Now</button>
            <div className="flex items-center gap-1">
              {!required && <button type="button" onClick={() => { emit(null); close() }} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100">Clear</button>}
              <button type="button" onClick={apply} className="rounded-lg bg-brand px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark">Apply</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
