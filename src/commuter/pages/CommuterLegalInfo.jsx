import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../../admin/components/Card.jsx'

const privacySections = [
  {
    title: 'This is a demonstration',
    body: 'This commuter experience is a prototype, not a connected QC Bus account or reporting service. Routes, bus activity, notifications, and report examples may be sample data and may not describe current service.',
  },
  {
    title: 'Information saved in this browser',
    body: 'The commuter profile fields (name, email, phone, and route preference) and alert or display preferences are saved in this browser’s local storage. A demo sign-in identifier and commuter session mode are held in session storage. The app does not save your password.',
  },
  {
    title: 'Forms, attachments, and location',
    body: 'Incident reports, lost-item inquiries, and feedback are demonstrations. Submissions and selected attachments stay in page memory and are not sent to a QC Bus service; refreshing the page clears them. This version does not request your device location. The “Use my location” setting is a demo preference only.',
  },
  {
    title: 'External resources',
    body: 'The app requests the Inter font from Google Fonts. Your browser contacts Google to load the font files. The commuter forms do not send their contents with these font requests.',
  },
  {
    title: 'Removing saved demo information',
    body: 'To remove the saved commuter profile and preferences, clear this site’s browser data. This also signs you out of the demo and may reset other locally saved prototype information.',
  },
  {
    title: 'Before public release',
    body: 'The responsible QC office must review and approve a production privacy notice. It should identify the responsible office and privacy contact, explain the purposes and lawful basis for processing, describe the information collected and who receives it, state retention periods, and explain how people can exercise their data privacy rights. These details are not established by this prototype.',
  },
]

export default function PrivacyPolicy() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Privacy Policy"
        description="What the commuter prototype stores and sends."
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
          Prototype information only. This is not an approved QC Government or QC Bus privacy notice. Have the responsible office review and replace it before public use.
        </p>
      </section>
    </div>
  )
}
