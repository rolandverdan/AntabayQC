import { PageHeader } from '../../admin/components/Card.jsx'

const helpTopics = [
  {
    question: 'How do I find a route or schedule?',
    answer: 'Open Bus Routes to search QC Bus routes and stops, or use the Timetable page to check scheduled trips.',
  },
  {
    question: 'Can I track a QC Bus on the map?',
    answer: 'Open Live Tracking and choose a route to view bus markers and stop updates. Bus positions shown are estimates and may differ from a bus’s exact current location.',
  },
  {
    question: 'Where can I see QC Bus delays or stop changes?',
    answer: 'Check Notifications for service and travel updates. Alerts are for general information and may not reflect current service.',
  },
  {
    question: 'Can I save a route I use often?',
    answer: 'Open My Trip, choose Add trip under Saved trips, then select an active QC Bus route. Saved routes are kept for this page session only.',
  },
  {
    question: 'How do I report a lost item?',
    answer: 'Submit the item details and the trip information you remember. You can review your submitted reports from the lost item reports page.',
  },
  {
    question: 'How do I report a service or safety concern?',
    answer: 'Use Incident Report to choose a concern category and provide the route, trip details, and a description.',
  },
  {
    question: 'How do I send feedback?',
    answer: 'Choose a feedback category, rate your trip, and describe what went well or what could improve.',
  },
]

export default function HelpSupport() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Help & Support"
      />

      <section className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm md:border-slate-200 md:p-4">
        <h2 className="mb-4 text-lg font-black text-navy">FAQ</h2>

        <div className="space-y-3">
          {helpTopics.map(({ question, answer }) => (
            <details key={question} className="group rounded-xl border border-slate-300 bg-white p-3 open:border-brand/30 open:bg-brand/[0.03] md:border-slate-200">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-navy marker:hidden">
                <span>{question}</span>
                <span className="text-lg leading-none text-brand transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-5 text-slate-600">{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
