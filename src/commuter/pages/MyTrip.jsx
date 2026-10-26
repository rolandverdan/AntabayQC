import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowDown,
  Clock3,
  MapPin,
  Route as RouteIcon,
  ShieldCheck,
  Star,
  Ticket,
  X,
} from 'lucide-react'
import { PageHeader } from '../../admin/components/Card.jsx'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'
import { useToast } from '../../admin/context/ToastContext.jsx'

const upcomingTrips = [
  {
    route: 'R-02 QC Hall ↔ Commonwealth',
    time: 'Today · 7:40 AM',
    from: 'Quezon Memorial Circle',
    to: 'Commonwealth Avenue',
    status: 'On time',
    tone: 'green',
  },
  {
    route: 'R-03 Cubao ↔ Katipunan',
    time: 'Today · 8:20 AM',
    from: 'Cubao Terminal',
    to: 'Katipunan Ave',
    status: 'Boarding soon',
    tone: 'blue',
  },
]

const tripHistory = [
  { route: 'R-01 QC Hall ↔ Cubao', date: 'Oct 22', fare: '₱20', rating: 4.8 },
  { route: 'R-05 Batasan ↔ Eastwood', date: 'Oct 20', fare: '₱20', rating: 4.6 },
  { route: 'R-02 QC Hall ↔ Commonwealth', date: 'Oct 18', fare: '₱20', rating: 4.9 },
]

export default function MyTrip() {
  const { routes, stopsById } = useAdminData()
  const { notify } = useToast()
  const [savedTrips, setSavedTrips] = useState(upcomingTrips)
  const [showTripDetails, setShowTripDetails] = useState(false)
  const [showAddTrip, setShowAddTrip] = useState(false)
  const [selectedRouteId, setSelectedRouteId] = useState('')
  const [expandedHistory, setExpandedHistory] = useState('')

  const addSavedTrip = (event) => {
    event.preventDefault()
    const route = routes.find((item) => item.id === selectedRouteId)
    if (!route) {
      notify('Choose a route before saving it.', 'error')
      return
    }
    if (savedTrips.some((trip) => trip.route.startsWith(`${route.id} `))) {
      notify(`${route.id} is already in your saved trips.`, 'info')
      return
    }

    const routeStops = route.stopIds.map((id) => stopsById[id]).filter(Boolean)
    setSavedTrips((items) => [...items, {
      route: `${route.id} ${route.name}`,
      time: 'Schedule not set',
      from: routeStops[0]?.name || 'Route origin',
      to: routeStops[routeStops.length - 1]?.name || 'Route destination',
      status: 'Saved route',
      tone: 'blue',
    }])
    setShowAddTrip(false)
    setSelectedRouteId('')
    notify('Route added to saved trips for this session.', 'success')
  }

  return (
    <>
      <PageHeader
        title="My Trip"
        description="Review your upcoming commute, recent trips, and route details in one place."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5">
          <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Ticket size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-navy">Upcoming trip</h2>
                  <p className="text-sm text-slate-500">Your next scheduled ride</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTripDetails((current) => !current)}
                aria-expanded={showTripDetails}
                className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-white hover:text-brand hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
              >
                {showTripDetails ? 'Hide details' : 'View details'}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-bold text-navy">
                  <RouteIcon size={16} className="text-brand" />
                  R-02 QC Hall ↔ Commonwealth
                </div>
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-green-700">
                  On time
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">From</p>
                    <p className="font-semibold text-navy">Quezon Memorial Circle</p>
                  </div>
                </div>

                <div className="flex items-center justify-center text-slate-400">
                  <ArrowDown size={18} />
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">To</p>
                    <p className="font-semibold text-navy">Commonwealth Avenue</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2"><Clock3 size={15} /> Today · 7:40 AM</span>
                <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-green-700" /> Safety check passed</span>
              </div>
              {showTripDetails && (
                <div className="mt-3 rounded-xl border border-brand/15 bg-white p-3 text-sm text-slate-600">
                  <p className="font-semibold text-navy">Trip details</p>
                  <p className="mt-1">Route R-02 · Quezon City Hall to Commonwealth Avenue.</p>
                  <p className="mt-1 text-xs text-slate-500">Schedule and bus status are sample information for this front-end demo.</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-navy">Saved trips</h2>
                <p className="text-sm text-slate-500">Your frequent route patterns</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTrip((current) => !current)}
                aria-expanded={showAddTrip}
                className="min-h-11 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-brand/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2"
              >
                {showAddTrip ? 'Cancel' : 'Add trip'}
              </button>
            </div>

            {showAddTrip && (
              <form onSubmit={addSavedTrip} className="mb-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row">
                <label htmlFor="saved-route" className="sr-only">Choose a route to save</label>
                <select
                  id="saved-route"
                  required
                  value={selectedRouteId}
                  onChange={(event) => setSelectedRouteId(event.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand"
                >
                  <option value="">Select a route...</option>
                  {routes.filter((route) => route.status === 'Active').map((route) => (
                    <option key={route.id} value={route.id}>{route.id} · {route.name}</option>
                  ))}
                </select>
                <button type="submit" className="min-h-11 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2">
                  Save route
                </button>
                <button type="button" onClick={() => setShowAddTrip(false)} aria-label="Close add trip form" className="min-h-11 min-w-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
                  <X size={16} />
                </button>
              </form>
            )}

            <div className="space-y-3" aria-live="polite">
              {savedTrips.length ? savedTrips.map((trip) => (
                <div key={trip.route} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-brand/25">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-navy">{trip.route}</p>
                      <p className="mt-1 text-xs text-slate-500">{trip.time}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                        trip.tone === 'green' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {trip.status}
                      </span>
                      {trip.status === 'Saved route' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSavedTrips((items) => items.filter((item) => item.route !== trip.route))
                            notify('Saved route removed for this session.', 'info')
                          }}
                          aria-label={`Remove ${trip.route} from saved trips`}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col items-start gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <span className="break-words">{trip.from}</span>
                    <ArrowRight size={14} aria-hidden="true" className="hidden shrink-0 text-slate-400 sm:block" />
                    <ArrowDown size={14} aria-hidden="true" className="sm:hidden" />
                    <span className="break-words">{trip.to}</span>
                  </div>
                </div>
              )) : (
                <p role="status" className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                  You haven’t saved any routes yet. Choose <strong>Add trip</strong> to save one for this session.
                </p>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Star size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black text-navy">Trip history</h3>
              </div>
            </div>

            <div className="space-y-3">
              {tripHistory.length ? tripHistory.map((trip) => (
                <div key={`${trip.route}-${trip.date}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-brand/25">
                  <button
                    type="button"
                    onClick={() => setExpandedHistory((current) => current === trip.route ? '' : trip.route)}
                    aria-expanded={expandedHistory === trip.route}
                    className="w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-navy">{trip.route}</span>
                        <span className="mt-1 block text-xs text-slate-500">{trip.date}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-sm font-bold text-brand">{trip.fare}</span>
                        <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-600">
                          <Star size={12} fill="currentColor" /> {trip.rating}
                        </span>
                      </span>
                    </span>
                  </button>
                  {expandedHistory === trip.route && (
                    <p className="mt-3 border-t border-slate-200 pt-2 text-xs leading-5 text-slate-500">
                      Sample trip · Fare and rating are demo details. You can share feedback from the Feedback page.
                    </p>
                  )}
                </div>
              )) : (
                <p role="status" className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                  Your recent trip history will appear here when it’s available.
                </p>
              )}
            </div>
          </div>

          <div className="hidden rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm md:block">
            <h3 className="mb-3 text-lg font-black text-navy">Quick actions</h3>
            <div className="space-y-3">
              {[
                { action: 'View live tracking', to: '/commuter/live-tracking' },
                { action: 'Plan another route', to: '/commuter/route-and-schedule' },
                { action: 'Check timetable', to: '/commuter/timetable' },
              ].map(({ action, to }) => (
                <Link
                  key={action}
                  to={to}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-white hover:text-brand hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  <span>{action}</span>
                  <ArrowRight size={14} />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
