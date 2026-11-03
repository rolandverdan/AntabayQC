import { Search, RotateCcw } from 'lucide-react'
import { inputClass } from '../utils/ui.js'
import Select from '../../shared/components/Select.jsx'
import DatePicker from '../../shared/components/DatePicker.jsx'

/** filters: [{ label, value, onChange, options: [{ value, label }] }] ; children = extra controls (e.g. date range) */
export default function SearchFilterBar({ search, onSearch, placeholder = 'Search…', filters = [], onClear, children }) {
  // No outer card: the controls sit directly on the page background so there is no "card inside a card",
  // with extra space below so they never touch the table.
  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
      <div className="relative min-w-0 flex-1 lg:min-w-64">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          aria-label="Search"
          className={`${inputClass(false)} min-h-10 pl-9`}
        />
      </div>
      {filters.map((f) => (
        <Select
          key={f.label}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
          aria-label={f.label}
          wrapperClassName="lg:w-auto lg:min-w-40"
        >
          <option value="">{f.label}: All</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value} data-tone={o.tone} data-desc={o.desc}>{o.label}</option>
          ))}
        </Select>
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
      <DatePicker value={from} max={to || undefined} onChange={(e) => onFrom(e.target.value)} aria-label="From date" placeholder="From date" wrapperClassName="lg:w-44" />
      <span>to</span>
      <DatePicker value={to} min={from || undefined} onChange={(e) => onTo(e.target.value)} aria-label="To date" placeholder="To date" wrapperClassName="lg:w-44" />
    </div>
  )
}
