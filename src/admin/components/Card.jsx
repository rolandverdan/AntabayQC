import { Link } from 'react-router-dom'

export function Card({ title, action, children, className = '', bodyClass = 'p-5' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-bold text-navy">{title}</h2>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  )
}

export default Card

const STAT_TONES = {
  blue: 'bg-brand/10 text-brand',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  teal: 'bg-deep/10 text-deep',
}

export function StatCard({ icon: Icon, label, value, sub, tone = 'blue', to }) {
  const body = (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${STAT_TONES[tone]}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold leading-tight text-navy">{value}</p>
        {sub && <p className="truncate text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  )
  return to ? <Link to={to} className="block">{body}</Link> : body
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-bold text-navy md:text-2xl">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

const NOTICE_TONES = {
  amber: 'border-amber-200 bg-amber-50 text-amber-900',
  blue: 'border-blue-200 bg-blue-50 text-blue-900',
  red: 'border-red-200 bg-red-50 text-red-900',
}

export function Notice({ tone = 'amber', icon: Icon, children }) {
  return (
    <div className={`mb-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs md:text-sm ${NOTICE_TONES[tone]}`}>
      {Icon && <Icon size={16} className="mt-0.5 shrink-0" />}
      <div>{children}</div>
    </div>
  )
}
