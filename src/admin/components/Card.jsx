import { Link } from 'react-router-dom'

export function Card({ title, action, children, className = '', bodyClass = 'p-4', footer, titleClass = 'text-navy' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || action) && (
        <header className="flex min-h-[3rem] items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
          <h2 className={`text-sm font-bold ${titleClass}`}>{title}</h2>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
      {footer && <footer className="flex flex-wrap items-center justify-end gap-2 rounded-b-xl border-t border-slate-100 bg-slate-50/70 px-4 py-2.5">{footer}</footer>}
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

export function StatCard({ icon: Icon, label, value, sub, tone = 'blue', to, reserveSub = false }) {
  const body = (
    <div className={`flex h-full items-center gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md ${reserveSub ? 'min-h-[7rem]' : ''}`}>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${STAT_TONES[tone]}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium leading-4 text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold leading-8 text-navy">{value}</p>
        {(sub || reserveSub) && <p className="mt-0.5 min-h-4 truncate text-xs leading-4 text-slate-500">{sub || '\u00a0'}</p>}
      </div>
    </div>
  )
  return to ? <Link to={to} className="block h-full">{body}</Link> : body
}

export function PageHeader({ title, description, actions, hideTitle = false }) {
  // hideTitle: only for screens whose top bar already shows the page name (Conductor).
  if (hideTitle && !description && !actions) return null
  return (
    <div className={`${hideTitle ? 'mb-4' : 'mb-6'} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6`}>
      <div className="min-w-0">
        {!hideTitle && <h1 className="text-xl font-bold leading-7 text-navy md:text-2xl md:leading-8">{title}</h1>}
        {description && <p className={`max-w-2xl text-sm text-slate-500 ${hideTitle ? '' : 'mt-1'}`}>{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">{actions}</div>}
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
