import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Bus, CircleHelp, FileText, Settings } from 'lucide-react'
import { PageHeader } from '../../admin/components/Card.jsx'

const faqs = [
  {
    question: 'Where can I find bus routes and schedules?',
    answer: 'Open Bus Routes to browse routes and their stops. Use the Timetable link on that page to view departure times by route and day.',
    href: '/commuter/route-and-schedule',
    linkLabel: 'View bus routes',
    icon: Bus,
  },
  {
    question: 'How do I report or check a lost item?',
    answer: 'Open Lost Item to submit details about your item and the trip. Use the reports and claims option on that page to review your submissions.',
    href: '/commuter/lost-item',
    linkLabel: 'Open Lost Item',
    icon: FileText,
  },
  {
    question: 'How do I report a safety or service concern?',
    answer: 'Use Incident Report to describe the concern, select its category and urgency, and include any helpful trip details.',
    href: '/commuter/report',
    linkLabel: 'Open Incident Report',
    icon: AlertTriangle,
  },
  {
    question: 'Where can I update my profile and preferences?',
    answer: 'Open Settings to review your commuter profile, notification preferences, and app preferences.',
    href: '/commuter/settings',
    linkLabel: 'Open Settings',
    icon: Settings,
  },
]

export default function Help() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Help & Support"
        description="Find answers to common questions about using commuter services."
      />

      <section className="max-w-4xl rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <CircleHelp size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-navy">Frequently asked questions</h2>
            <p className="text-sm text-slate-500">Quick answers about using commuter services</p>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map(({ question, answer, href, linkLabel, icon: Icon }) => (
            <details key={question} className="group rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center gap-3 text-sm font-semibold text-navy marker:hidden">
                <Icon size={17} aria-hidden="true" className="shrink-0 text-brand" />
                <span className="flex-1">{question}</span>
                <ArrowRight aria-hidden="true" size={16} className="rotate-90 text-slate-400 transition-transform group-open:-rotate-90" />
              </summary>
              <div className="pl-8 pt-3 text-sm leading-6 text-slate-600">
                <p>{answer}</p>
                <Link to={href} className="mt-2 inline-flex min-h-11 items-center gap-1 font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
                  {linkLabel}<ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
