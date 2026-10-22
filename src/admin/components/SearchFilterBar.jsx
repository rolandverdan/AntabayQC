import { Search, RotateCcw } from 'lucide-react'
import { inputClass } from '../utils/ui.js'

/** filters: [{ label, value, onChange, options: [{ value, label }] }] ; children = extra controls (e.g. date range) */
export default function SearchFilterBar({ search, onSearch, placeholder = 'Search…', filters = [], onClear, children }) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:flex-wrap lg:items-center">
      <div className="relative min-w-0 flex-1 lg:min-w-64">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          aria-label="Search"
          className={`${inputClass(false)} pl-9`}
        />
      </div>
      {filters.map((f) => (
        <select
          key={f.label}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
          aria-label={f.label}
          className={`${inputClass(false)} lg:w-auto`}
        >
          <option value="">{f.label}: All</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}
      {children}
      {onClear && (
        <button type="button" onClick={onClear} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
          <RotateCcw size={13} /> Clear
        </button>
      )}
    </div>
  )
}

export function DateRange({ from, to, onFrom, onTo }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <input type="date" value={from} max={to || undefined} onChange={(e) => onFrom(e.target.value)} aria-label="From date" className={`${inputClass(false)} lg:w-auto`} />
      <span>to</span>
      <input type="date" value={to} min={from || undefined} onChange={(e) => onTo(e.target.value)} aria-label="To date" className={`${inputClass(false)} lg:w-auto`} />
    </div>
  )
}
