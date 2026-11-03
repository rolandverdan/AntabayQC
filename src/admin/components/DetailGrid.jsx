/** Label/value pairs in a 2-column grid. Labels use the same style as form labels (bold, dark) so they stay readable. */
export default function DetailGrid({ items, className = '', muted = false }) {
  return (
    <dl className={`grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 ${className}`}>
      {items.map(([label, value, full]) => (
        <div key={label} className={full ? 'sm:col-span-2' : ''}>
          <dt className={muted ? 'text-[11px] font-semibold uppercase tracking-wide text-slate-400' : 'text-xs font-semibold text-navy'}>{label}</dt>
          <dd className="mt-1 text-sm text-slate-800">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}
