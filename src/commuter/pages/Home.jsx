import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarClock,
  Check,
  ChevronRight,
  LifeBuoy,
  MapPinned,
  PhoneCall,
  Route as RouteIcon,
  Search,
  UserRound,
} from 'lucide-react'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'
import { routeColor } from '../../admin/utils/geo.js'
import { useNotifications } from '../context/NotificationsContext.jsx'
import { TONE_CLASSES } from '../data/notifications.js'

const FAQS = [
  { q: 'How do I know when my bus is arriving?', a: 'Open Live Tracking, pick your route, then tap a bus to see its next stop and estimated arrival.' },
  { q: 'What are the service hours?', a: 'QC Bus runs daily from 6:00 AM to 9:00 PM, except on holidays. Check Timetable for each route.' },
  { q: 'I left something on the bus. What do I do?', a: 'Go to Support, then Lost Item, and send a report. You can check its status there too.' },
]

export default function CommuterHome() {
  const { routes, buses } = useAdminData()
  const { notifications, unreadCount } = useNotifications()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const activeRoutes = routes.filter((r) => r.status === 'Active')
  const activeBuses = buses.filter((b) => b.status === 'Active').length
  const allOperational = routes.length > 0 && activeRoutes.length === routes.length

  const search = (event) => {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/commuter/route-and-schedule?q=${encodeURIComponent(q)}` : '/commuter/route-and-schedule')
  }

  // Each card summarises one main feature; the whole card opens it.
  const features = [
    {
      title: 'Bus Routes',
      to: '/commuter/route-and-schedule',
      icon: RouteIcon,
      tile: 'bg-yellow-100 text-yellow-700',
      summary: `${routes.length} routes across Quezon City`,
      extra: (
        <span className="mt-2 flex gap-1" aria-hidden="true">
          {routes.map((r) => <span key={r.id} className="h-2 w-5 rounded-full" style={{ background: routeColor(r.id, r) }} />)}
        </span>
      ),
    },
    {
      title: 'Timetable',
      to: '/commuter/timetable',
      icon: CalendarClock,
      tile: 'bg-sky-100 text-sky-700',
      summary: 'Departure times by route, Monday to Sunday',
    },
    {
      title: 'Live Tracking',
      to: '/commuter/live-tracking',
      icon: MapPinned,
      tile: 'bg-green-100 text-green-700',
      summary: `${activeBuses} bus${activeBuses === 1 ? '' : 'es'} on the road right now`,
    },
    {
      title: 'Support',
      to: '/commuter/support',
      icon: LifeBuoy,
      tile: 'bg-red-100 text-red-700',
      summary: 'Lost item, incident report and feedback',
    },
    {
      title: 'My Trip',
      to: '/commuter/my-trip',
      icon: UserRound,
      tile: 'bg-blue-100 text-blue-700',
      summary: 'Saved trips and your trip history',
    },
    {
      title: 'Notifications',
      to: '/commuter/notification',
      icon: Bell,
      tile: 'bg-violet-100 text-violet-700',
      summary: unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'You are all caught up',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <section className="space-y-4 lg:col-span-2">
        {/* Live service status + quick search (replaces the static bus photo) */}
        <div className="rounded-2xl bg-brand p-4 text-white shadow-sm md:p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-100">
            <span className={`h-2.5 w-2.5 rounded-full ${allOperational ? 'bg-green-400' : 'bg-amber-400'}`} />
            Live service status
          </p>
          <p className="mt-1.5 text-lg font-bold leading-snug md:text-xl">
            {allOperational ? `All ${routes.length} Routes Operational` : `${activeRoutes.length} of ${routes.length} Routes Operational`}
            <span className="mx-2 font-normal text-white/40">|</span>
            {activeBuses} Active Bus{activeBuses === 1 ? '' : 'es'}
          </p>
          <p className="mt-0.5 text-xs text-blue-100">Service hours: 6:00 AM – 9:00 PM, Monday – Sunday</p>

          <form onSubmit={search} role="search" className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-white/70">
            <Search size={18} className="shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Where are you going? Search a route or stop"
              aria-label="Search routes or stops"
              className="min-h-9 w-full min-w-0 border-0 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none"
            />
            <button type="submit" className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark">Search</button>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {features.map(({ title, to, icon: Icon, tile, summary, extra }) => (
            <Link
              key={title}
              to={to}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tile}`}>
                <Icon size={24} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold text-navy">{title}</span>
                <span className="mt-0.5 block text-sm leading-5 text-slate-500">{summary}</span>
                {extra}
              </span>
              <ChevronRight size={20} className="shrink-0 text-slate-300 transition group-hover:text-brand" />
            </Link>
          ))}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-bold text-navy"><Bell size={16} className="text-slate-500" /> Latest Updates</h2>
            <Link to="/commuter/notification" className="text-xs font-semibold text-brand hover:underline">View all</Link>
          </div>
          <ul className="space-y-2">
            {notifications.slice(0, 2).map(({ id, title, time, icon: Icon, tone, unread }) => (
              <li key={id}>
                <Link to="/commuter/notification" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-brand/30 hover:bg-white">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE_CLASSES[tone]}`}><Icon size={17} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-700">{title}</span>
                    <span className="block text-xs text-slate-500">{time}</span>
                  </span>
                  {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-brand p-4 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15"><PhoneCall size={22} /></span>
            <div>
              <h2 className="text-base font-bold">QC LGU Hotline</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-blue-100"><Check size={14} className="text-green-300" /> Police Dispatch Active</p>
            </div>
          </div>
          <a href="tel:122" className="mt-3 flex items-center justify-between rounded-xl bg-white px-4 py-3 text-brand transition hover:bg-blue-50">
            <span className="text-sm font-semibold">Call hotline</span>
            <span className="text-xl font-bold">122</span>
          </a>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-base font-bold text-navy">Common Questions</h2>
          <div className="divide-y divide-slate-100">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group py-2">
                <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-700 [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronRight size={16} className="shrink-0 text-slate-400 transition group-open:rotate-90" />
                </summary>
                <p className="pb-1 text-sm leading-6 text-slate-500">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
