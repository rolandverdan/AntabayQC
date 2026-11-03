import { Check, Lock } from 'lucide-react'

/** Grouped block of fields inside a modal/form: a tinted heading bar, then the fields. */
export function Section({ title, children, className = '' }) {
  return (
    <section className={className}>
      <h3 className="mb-4 rounded-md border-l-4 border-brand bg-slate-100 px-3 py-1.5 text-xs font-bold text-navy">{title}</h3>
      {children}
    </section>
  )
}

/** Read-only value shown as a chip (e.g. Employee ID with a padlock). */
export function LockedChip({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-600">
      <Lock size={12} className="shrink-0 text-slate-500" aria-hidden="true" />
      {label} <span className="font-mono font-bold text-navy">{value}</span>
    </span>
  )
}

export const PASSWORD_RULES = [
  { id: 'len', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'case', label: 'Uppercase and lowercase letters', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: 'num', label: 'At least one number', test: (p) => /\d/.test(p) },
  { id: 'sym', label: 'At least one special character (!@#$...)', test: (p) => /[^A-Za-z0-9]/.test(p) },
]
export const passwordMeetsRules = (p) => PASSWORD_RULES.every((r) => r.test(p || ''))

/** Live checklist: each rule turns into a green check once the password satisfies it. */
export function PasswordChecklist({ password = '', className = '' }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50 p-3.5 ${className}`}>
      <p className="mb-2.5 text-xs font-semibold text-navy">Password requirements</p>
      <ul className="space-y-2">
        {PASSWORD_RULES.map((r) => {
          const ok = r.test(password)
          return (
            <li key={r.id} className={`flex items-center gap-2 text-xs ${ok ? 'font-medium text-green-700' : 'text-slate-600'}`}>
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${ok ? 'border-green-600 bg-green-600 text-white' : 'border-slate-300 bg-white'}`}>
                {ok && <Check size={10} strokeWidth={3} />}
              </span>
              {r.label}
              <span className="sr-only">{ok ? '(met)' : '(not met)'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const ACCENT = {
  red: { bar: 'border-l-red-500', icon: 'bg-red-100 text-red-600' },
  amber: { bar: 'border-l-amber-500', icon: 'bg-amber-100 text-amber-600' },
  blue: { bar: 'border-l-blue-500', icon: 'bg-blue-100 text-blue-600' },
  green: { bar: 'border-l-green-500', icon: 'bg-green-100 text-green-600' },
  gray: { bar: 'border-l-slate-400', icon: 'bg-slate-100 text-slate-600' },
}

/** Tone for a severity / priority word. */
export const toneOf = (v) =>
  ({ Critical: 'red', High: 'red', Error: 'red', Emergency: 'red', Medium: 'amber', Warning: 'amber', Low: 'blue', Info: 'blue', Success: 'green' })[v] || 'gray'

/** Summary card at the top of a details modal: coloured accent edge, round icon, title + subtitle, pills on the right. */
export function DetailHeader({ icon: Icon, tone = 'blue', title, subtitle, children }) {
  const a = ACCENT[tone] || ACCENT.blue
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-l-4 border-slate-200 bg-white p-4 shadow-sm ${a.bar}`}>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${a.icon}`}><Icon size={20} aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold leading-snug text-navy">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

/** One fact in a details modal: small icon square, tiny uppercase label, bold value. */
export function InfoTile({ icon: Icon, label, value, mono = false, className = '' }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand"><Icon size={17} aria-hidden="true" /></span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`mt-0.5 break-words text-sm font-bold text-navy ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
      </div>
    </div>
  )
}

export const SmallLabel = ({ children, className = '' }) => (
  <p className={`text-[10px] font-semibold uppercase tracking-wide text-slate-400 ${className}`}>{children}</p>
)
