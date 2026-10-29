import { Link } from 'react-router-dom'
import { ChevronRight, CircleAlert, MessageSquareText, PackageSearch } from 'lucide-react'
import { PageHeader } from '../../admin/components/Card.jsx'

const options = [
  {
    title: 'Lost Item',
    description: 'Report something you left on a bus, or check on a report you already sent.',
    to: '/commuter/lost-item',
    icon: PackageSearch,
    tile: 'bg-amber-100 text-amber-700',
  },
  {
    title: 'Incident Report',
    description: 'Tell us about a safety concern, a delay, or a problem with a bus or driver.',
    to: '/commuter/report',
    icon: CircleAlert,
    tile: 'bg-red-100 text-red-700',
  },
  {
    title: 'Feedback',
    description: 'Rate your ride and share suggestions to help improve QC Bus.',
    to: '/commuter/feedback',
    icon: MessageSquareText,
    tile: 'bg-blue-100 text-blue-700',
  },
]

// One place for the three "tell us something" features, so the main menu stays short.
export default function Support() {
  return (
    <>
      <PageHeader title="Support" description="What do you need help with? Choose one below." />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {options.map(({ title, description, to, icon: Icon, tile }) => (
          <Link
            key={title}
            to={to}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 md:flex-col md:items-start md:gap-3 md:p-4"
          >
            <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tile}`}>
              <Icon size={28} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold text-navy">{title}</span>
              <span className="mt-1 block text-sm leading-5 text-slate-500">{description}</span>
            </span>
            <ChevronRight size={22} className="shrink-0 text-slate-300 transition group-hover:text-brand md:hidden" />
          </Link>
        ))}
      </div>
    </>
  )
}
