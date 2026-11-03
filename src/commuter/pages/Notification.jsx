import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '../../admin/components/Card.jsx'
import { useToast } from '../../admin/context/ToastContext.jsx'
import { useNotifications } from '../context/NotificationsContext.jsx'

const summaryStats = [
  { label: 'Unread', value: '3', icon: Bell, tone: 'blue' },
  { label: 'Active alerts', value: '2', icon: AlertTriangle, tone: 'amber' },
  { label: 'Resolved', value: '6', icon: CheckCircle2, tone: 'green' },
]

const filters = ['All', 'Unread', 'Service', 'Safety']

const initialPreferences = {
  'Service disruptions': true,
  'Safety alerts': true,
  'Route updates': true,
  'Report follow-ups': false,
}

export default function Notification() {
  const { notify } = useToast()
  const { notifications, markRead, markAllRead: markEveryRead } = useNotifications()
  const [activeFilter, setActiveFilter] = useState('All')
  const [preferences, setPreferences] = useState(initialPreferences)
  const unreadCount = notifications.filter((notification) => notification.unread).length
  const activeAlertCount = notifications.filter((notification) => notification.tone === 'amber' || notification.category === 'Safety alert').length
  const filteredNotifications = useMemo(() => notifications.filter((notification) => {
    if (activeFilter === 'Unread') return notification.unread
    if (activeFilter === 'Service') return notification.category === 'Service update' || notification.category === 'Travel update'
    if (activeFilter === 'Safety') return notification.category === 'Safety alert'
    return true
  }), [activeFilter, notifications])

  const markNotificationRead = markRead

  const markAllRead = () => {
    if (!unreadCount) return
    markEveryRead()
    notify('All notifications marked as read.', 'success')
  }

  const togglePreference = (preference) => {
    setPreferences((current) => ({ ...current, [preference]: !current[preference] }))
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Stay up to date with service changes, safety advisories, and updates on your reports."
      />

      <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-4">
        {summaryStats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:p-4">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">{label}</p>
                <p className="mt-1 text-base font-bold text-navy sm:mt-2 sm:text-xl">
                  {label === 'Unread' ? unreadCount : label === 'Active alerts' ? activeAlertCount : value}
                </p>
              </div>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${
                tone === 'blue' ? 'bg-brand/10 text-brand' :
                tone === 'amber' ? 'bg-amber-100 text-amber-700' :
                'bg-green-100 text-green-700'
              }`}>
                <Icon size={16} className="sm:h-5 sm:w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-slate-100 px-4 py-4">
            {/* Title and its action share one row; the description stays on a single line. */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Bell size={18} />
                </div>
                <h2 className="truncate text-base font-black text-navy sm:text-lg">Latest updates</h2>
              </div>
              <button
                type="button"
                onClick={markAllRead}
                disabled={!unreadCount}
                className="shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-bold text-brand transition-colors hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              >
                Mark all as read
              </button>
            </div>
            <p className="truncate text-xs text-slate-500">Pulled from QC Bus alerts and commuter activity.</p>

            <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Filter notifications">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  aria-pressed={activeFilter === filter}
                  className={`min-h-9 rounded-lg px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:text-sm ${
                    activeFilter === filter ? 'bg-brand text-white shadow-sm' : 'text-slate-600 hover:bg-white/70'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredNotifications.length ? filteredNotifications.map(({ id, category, title, detail, time, icon: Icon, tone, unread }) => (
              <div
                key={id}
                className={`flex gap-3 px-4 py-3.5 transition ${unread ? 'bg-slate-50/70' : 'bg-white'}`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  tone === 'amber' ? 'bg-amber-100 text-amber-700' :
                  tone === 'blue' ? 'bg-blue-100 text-blue-700' :
                  tone === 'green' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  {/* Category + NEW on the left, time on the right. */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-500">{category}</span>
                      {unread && (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-brand/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand">New</span>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-500">{time}</span>
                  </div>

                  <div className="mt-1 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold leading-snug text-navy">{title}</h3>
                      <p className="mt-0.5 text-xs leading-5 text-slate-600">{detail}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => markNotificationRead(id)}
                      aria-label={unread ? `Mark ${title} as read` : `${title} is read`}
                      title={unread ? 'Mark as read' : 'Read'}
                      disabled={!unread}
                      className="-mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand transition hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-default disabled:text-green-600 disabled:hover:bg-transparent"
                    >
                      {unread ? <ChevronRight size={22} strokeWidth={2.5} /> : <CheckCircle2 size={22} />}
                    </button>
                  </div>
                </div>
              </div>
            )) : <p className="p-5 text-center text-sm text-slate-500">No notifications match this filter.</p>}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Sparkles size={18} />
              </div>
              <h3 className="text-lg font-black text-navy">Alert preferences</h3>
            </div>

            <div className="space-y-3">
              {Object.entries(preferences).map(([item, enabled]) => (
                <label key={item} className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 transition-colors hover:border-brand/30 hover:bg-white">
                  <span>{item}</span>
                  <input type="checkbox" checked={enabled} onChange={() => togglePreference(item)} className="h-4 w-4 accent-brand" />
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Preferences are saved for this page session only.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
