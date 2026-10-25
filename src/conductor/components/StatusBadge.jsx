const STYLES = {
  Online: { dot: 'bg-green-500', cls: 'bg-green-100 text-green-700 ring-green-600/20' },
  Offline: { dot: 'bg-slate-400', cls: 'bg-slate-100 text-slate-600 ring-slate-500/20' },
  Connecting: { dot: 'bg-amber-500 animate-pulse', cls: 'bg-amber-100 text-amber-800 ring-amber-600/20' },
  Error: { dot: 'bg-red-500', cls: 'bg-red-100 text-red-700 ring-red-600/20' },
}

// Status is always shown as text plus a dot, never colour alone.
export default function StatusBadge({ status, className = '' }) {
  const s = STYLES[status] || STYLES.Offline
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.cls} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {status}
    </span>
  )
}
