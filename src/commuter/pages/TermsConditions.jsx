import { Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { PageHeader } from '../../admin/components/Card.jsx'

const terms = [
  {
    title: 'Prototype use',
    body: 'This commuter experience is a front-end capstone prototype. Routes, schedules, bus locations, alerts, reports, and other service details may be sample information and are not official QC Bus service updates.',
  },
  {
    title: 'Reports and feedback',
    body: 'Lost-item reports, incident reports, and feedback created in this prototype are demonstration entries. They are not sent to QC Bus or an operations team and should not be used to request real-world assistance.',
  },
  {
    title: 'Account features',
    body: 'Password changes and device management are not connected to an account service. Settings saved in this browser are prototype preferences and do not change live services.',
  },
  {
    title: 'Before public use',
    body: 'These draft terms require review and approval from the appropriate Quezon City Government and QC Bus representatives before any public deployment.',
  },
]

export default function TermsConditions() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Terms & Conditions"
        description="Draft terms for the Antabay QC commuter prototype."
        actions={(
          <Link to="/commuter/settings" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-brand/40 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 md:border-slate-200">
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        )}
      />

      <section className="rounded-[18px] border border-slate-300 bg-white p-4 shadow-sm md:border-slate-200 md:p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <FileText size={19} />
          </span>
          <h2 className="text-lg font-black text-navy">Terms & Conditions</h2>
        </div>

        <div className="space-y-4">
          {terms.map(({ title, body }) => (
            <article key={title} className="rounded-xl border border-slate-300 bg-white p-3 md:border-slate-200 md:bg-slate-50">
              <h3 className="text-sm font-bold text-navy">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </div>

        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          Prototype draft only. This is not an approved QC Government or QC Bus legal notice. Replace it with reviewed, organization-approved legal text before public use.
        </p>
      </section>
    </div>
  )
}
