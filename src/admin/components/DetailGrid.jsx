export default function DetailGrid({ items }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(([label, value, full]) => (
        <div key={label} className={full ? 'sm:col-span-2' : ''}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
          <dd className="mt-0.5 text-sm text-slate-800">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}
