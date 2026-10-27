import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../../admin/components/Card.jsx'

const privacySections = [
  {
    title: 'Information in this prototype',
    body: 'Profile details and preference toggles are saved in this browser’s local storage. Form entries and sample reports are held in page state for the demonstration and are not transmitted to an operations service.',
  },
  {
    title: 'Use fictional information',
    body: 'Please use fictional details while reviewing this prototype. Do not enter real passwords, identification numbers, or sensitive personal information.',
  },
  {
    title: 'No connected service',
    body: 'This prototype does not connect commuter forms to a live QC Bus reporting service. Sample notifications, route information, and tracking data may not reflect current operations.',
  },
  {
    title: 'Information needed before launch',
    body: 'An approved production privacy notice must identify the responsible office and contact, explain the specific purposes and lawful basis for data use, describe recipients and retention, and explain how people can exercise applicable rights. Those production details are not established in this prototype.',
  },
]

export default function PrivacyPolicy() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Privacy Policy"
        description="Draft privacy information for the Antabay QC commuter prototype."
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
            <ShieldCheck size={19} />
          </span>
          <h2 className="text-lg font-black text-navy">Privacy Policy</h2>
        </div>

        <div className="space-y-4">
          {privacySections.map(({ title, body }) => (
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
