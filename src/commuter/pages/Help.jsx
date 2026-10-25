import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Bus,
  CircleHelp,
  FileText,
} from 'lucide-react'
import { PageHeader } from '../../admin/components/Card.jsx'

const faqs = [
  {
    question: 'Where can I find routes and schedules?',
    answer: 'Open Bus Routes to explore available routes and stops. The schedule page shows departure information by route and day.',
    href: '/commuter/route-and-schedule',
    linkLabel: 'View bus routes',
    icon: Bus,
  },
  {
    question: 'How do I report a lost item?',
    answer: 'Submit the item details through the Lost Item page. This interface is a front-end demo, so reports are not sent to a real operations team.',
    href: '/commuter/lost-item',
    linkLabel: 'Go to Lost Item',
    icon: FileText,
  },
  {
    question: 'How do I report a safety or service concern?',
    answer: 'Use Incident Report to record a concern in the demo. If you need immediate assistance, call the QC LGU hotline at 122.',
    href: '/commuter/report',
    linkLabel: 'Open Incident Report',
    icon: AlertTriangle,
  },
  {
    question: 'Can I change my profile and preferences?',
    answer: 'Yes. Profile details and display preferences can be saved in this browser from Settings. Password and signed-in device management require an account service and are not available in this demo.',
    href: '/commuter/settings',
    linkLabel: 'Open Settings',
    icon: CircleHelp,
  },
]

export default function Help() {
  return (
    <>
      <PageHeader
        title="Help & Support"
        description="Browse answers to common questions about using commuter services."
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
                <Icon size={17} className="shrink-0 text-brand" />
                <span className="flex-1">{question}</span>
                <ArrowRight size={16} className="rotate-90 text-slate-400 transition-transform group-open:-rotate-90" />
              </summary>
              <div className="pl-8 pt-3 text-sm leading-6 text-slate-600">
                <p>{answer}</p>
                <Link to={href} className="mt-2 inline-flex items-center gap-1 font-semibold text-brand hover:underline">
                  {linkLabel}<ArrowRight size={14} />
                </Link>
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}
