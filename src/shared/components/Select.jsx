import { Children, isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search } from 'lucide-react'
import usePopover from './usePopover.js'

/**
 * Custom dropdown that is a drop-in replacement for <select>:
 *   <Select value={v} onChange={(e) => set(e.target.value)} required>
 *     <option value="">Choose…</option>
 *     <option value="a" data-tone="green" data-desc="Helper text" data-avatar="Maria Garcia">Label</option>
 *   </Select>
 * Option extras (all optional): data-tone = colored status dot, data-desc = second line,
 * data-avatar = initials avatar (pass a name). A search box appears automatically for long lists.
 */

const DOT = {
  green: 'bg-green-500', amber: 'bg-amber-500', red: 'bg-red-500', blue: 'bg-blue-500',
  gray: 'bg-slate-400', cyan: 'bg-cyan-500', orange: 'bg-orange-500',
}
// Labels that are obviously a status get a dot automatically.
const AUTO_TONE = {
  Active: 'green', Inactive: 'gray', Maintenance: 'amber', Emergency: 'red',
  Critical: 'red', High: 'orange', Medium: 'amber', Low: 'blue',
  New: 'red', Acknowledged: 'amber', 'In Progress': 'blue', Resolved: 'green',
  Pending: 'amber', 'Under Review': 'blue', Dismissed: 'gray',
}

function textOf(node) {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement(node)) return textOf(node.props.children)
  return ''
}

function collect(children, out = []) {
  Children.forEach(children, (c) => {
    if (!isValidElement(c)) return
    if (c.type === 'option') {
      const p = c.props
      out.push({
        value: String(p.value ?? textOf(p.children)),
        label: textOf(p.children),
        disabled: !!p.disabled,
        tone: p['data-tone'],
        desc: p['data-desc'],
        avatar: p['data-avatar'],
      })
    } else if (c.type === 'optgroup' || c.props?.children) collect(c.props.children, out)
  })
  return out
}

const initialsOf = (name = '') => name.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?'

function Avatar({ name }) {
  return <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand" aria-hidden="true">{initialsOf(name)}</span>
}

function Lead({ opt, small = false }) {
  const tone = opt.tone || AUTO_TONE[opt.label]
  if (opt.avatar) return <Avatar name={opt.avatar} />
  if (tone && DOT[tone]) return <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[tone]} ${small ? '' : 'ring-2 ring-white'}`} aria-hidden="true" />
  return null
}

export default function Select({
  value, onChange, children, className = '', wrapperClassName = '', disabled = false, required = false,
  id, name, searchable, placeholder, 'aria-label': ariaLabel, leading,
}) {
  const options = useMemo(() => collect(children), [children])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listId = useId()
  const close = useCallback(() => { setOpen(false); setQuery('') }, [])
  const { triggerRef, panelRef, style } = usePopover({ open, onClose: close, minWidth: 200, maxHeight: 340 })
  const searchRef = useRef(null)
  const listRef = useRef(null)

  const current = options.find((o) => o.value === String(value ?? ''))
  const showSearch = searchable ?? options.length > 7
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter((o) => `${o.label} ${o.desc || ''}`.toLowerCase().includes(q)) : options
  }, [options, query])

  useEffect(() => {
    if (!open) return
    const i = shown.findIndex((o) => o.value === String(value ?? ''))
    setActive(Math.max(0, i))
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  useEffect(() => { setActive(0) }, [query])
  useEffect(() => {
    if (open) listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const pick = (opt) => {
    if (!opt || opt.disabled) return
    onChange?.({ target: { value: opt.value, name, id } })
    close()
    triggerRef.current?.focus()
  }

  const onKeyDown = (e) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); setOpen(true) }
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(shown.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); pick(shown[active]) }
    else if (e.key === 'Tab') close()
  }

  const isPlaceholder = !current || current.value === ''
  const base = `flex min-h-10 w-full items-center gap-2 rounded-lg border ${/\bborder-/.test(className) ? '' : 'border-slate-300'} ${/\bbg-/.test(className) ? '' : 'bg-white'} px-3 py-2 text-left text-sm text-slate-800 outline-none transition focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 [@media(pointer:coarse)]:min-h-[44px]`
  const cls = className ? `${base} ${className}` : base

  return (
    <div className={`relative ${wrapperClassName}`}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`${cls} ${open ? '!border-brand ring-2 ring-brand/20' : ''}`}
      >
        {leading}
        {current && !isPlaceholder && <Lead opt={current} small />}
        <span className="min-w-0 flex-1">
          <span className={`block truncate ${isPlaceholder ? 'text-slate-400' : ''}`}>{isPlaceholder ? (current?.label || placeholder || 'Select…') : current.label}</span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-slate-500 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {required && <input tabIndex={-1} aria-hidden="true" required value={String(value ?? '')} onChange={() => {}} className="pointer-events-none absolute inset-0 h-full w-full opacity-0" />}

      {open && createPortal(
        <div ref={panelRef} style={style} className="z-[1300] flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl" onKeyDown={onKeyDown}>
          {showSearch && (
            <div className="relative border-b border-slate-100 p-2">
              <Search size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                aria-label="Search options"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2 text-sm outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
              />
            </div>
          )}
          <ul ref={listRef} id={listId} role="listbox" className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {shown.length === 0 && <li className="px-3 py-6 text-center text-xs text-slate-500">No matches found</li>}
            {shown.map((o, i) => {
              const selected = o.value === String(value ?? '')
              return (
                <li
                  key={o.value + i}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={o.disabled || undefined}
                  data-active={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(o)}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${o.disabled ? 'cursor-not-allowed opacity-40' : ''} ${i === active ? 'bg-brand/10' : ''} ${selected ? 'font-semibold text-brand' : 'text-slate-700'}`}
                >
                  <Lead opt={o} />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate ${o.value === '' ? 'text-slate-400' : ''}`}>{o.label}</span>
                    {o.desc && <span className="block truncate text-xs font-normal text-slate-500">{o.desc}</span>}
                  </span>
                  {selected && <Check size={16} className="shrink-0 text-brand" aria-hidden="true" />}
                </li>
              )
            })}
          </ul>
        </div>,
        document.body,
      )}
    </div>
  )
}
