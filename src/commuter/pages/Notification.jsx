import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPinned,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '../../admin/components/Card.jsx'

const notificationList = [
  {
    id: 1,
    category: 'Service update',
    title: 'Route 2 delay expected',
    detail: 'Traffic congestion near Quezon Memorial Circle may affect arrivals by 8 to 12 minutes this afternoon.',
    time: '2 mins ago',
    icon: Clock3,
    tone: 'amber',
    unread: true,
  },
  {
    id: 2,
    category: 'Safety alert',
    title: 'Weather advisory',
    detail: 'Light rain is expected along Commonwealth and Katipunan corridors. Please allow extra time for boarding.',
    time: '1 hour ago',
    icon: ShieldCheck,
    tone: 'blue',
    unread: true,
  },
  {
    id: 3,
    category: 'Travel update',
    title: 'Bus stop temporarily rerouted',
    detail: 'Stop at Batasan Road will be temporarily moved to the adjacent curb due to road repair works.',
    time: 'Today, 8:45 AM',
    icon: MapPinned,
    tone: 'green',
    unread: false,
  },
  {
    id: 4,
    category: 'Important',
    title: 'Report status update',
    detail: 'Your lost item report has been reviewed and the operations desk has assigned a follow-up team to check the terminal desk.',
    time: 'Yesterday',
    icon: Bell,
    tone: 'red',
    unread: true,
  },
]

const summaryStats = [
  { label: 'Unread', value: '3', icon: Bell, tone: 'blue' },
  { label: 'Active alerts', value: '2', icon: AlertTriangle, tone: 'amber' },
  { label: 'Resolved', value: '6', icon: CheckCircle2, tone: 'green' },
]

const filters = ['All', 'Unread', 'Service', 'Safety']

export default function Notification() {
  return (
    <>
      <PageHeader
        title="Notifications"
        description="Stay up to date with service changes, safety advisories, and updates on your reports."
      />

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        {summaryStats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-black text-navy">{value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                tone === 'blue' ? 'bg-brand/10 text-brand' :
                tone === 'amber' ? 'bg-amber-100 text-amber-700' :
                'bg-green-100 text-green-700'
              }`}>
                <Icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-[18px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Bell size={18} />
              </div>
              <div>
                <h2 className="text-lg font-black text-navy">Latest updates</h2>
                <p className="text-xs text-slate-500">Pulled from QC Bus alerts and commuter activity.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((filter, index) => (
                <button
                  key={filter}
                  type="button"
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    index === 0
                      ? 'bg-brand text-white shadow-sm'
                      : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-brand/30 hover:text-brand'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {notificationList.map(({ id, category, title, detail, time, icon: Icon, tone, unread }) => (
              <div
                key={id}
                className={`flex gap-4 p-4 transition ${unread ? 'bg-slate-50/70' : 'bg-white'}`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  tone === 'amber' ? 'bg-amber-100 text-amber-700' :
                  tone === 'blue' ? 'bg-blue-100 text-blue-700' :
                  tone === 'green' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{category}</span>
                    {unread && (
                      <span className="inline-flex items-center rounded-full bg-brand/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-brand">
                        New
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className="text-[10px] text-slate-500">{time}</span>
                  </div>

                  <div className="mt-1 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-navy">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
                    </div>
                    <button type="button" className="mt-1 hidden rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-brand lg:inline-flex">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Sparkles size={18} />
              </div>
              <h3 className="text-lg font-black text-navy">Alert preferences</h3>
            </div>

            <div className="space-y-3">
              {['Service disruptions', 'Safety alerts', 'Route updates', 'Report follow-ups'].map((item, idx) => (
                <label key={item} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                  <span>{item}</span>
                  <input type="checkbox" defaultChecked={idx < 3} className="h-4 w-4 accent-brand" />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <CheckCircle2 size={18} />
              </div>
              <h3 className="text-lg font-black text-navy">Recent actions</h3>
            </div>

            <ul className="space-y-3 text-sm text-slate-600">
              <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">Lost item report reviewed for Terminal 2.</li>
              <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">Feedback submitted for Route 3 service quality.</li>
              <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">Route and schedule updated after road repair notice.</li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  )
}
