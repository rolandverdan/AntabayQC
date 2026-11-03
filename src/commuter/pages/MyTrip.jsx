import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowDown,
  Clock3,
  MapPin,
  Navigation,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react'
import { PageHeader } from '../../admin/components/Card.jsx'
import Modal from '../../admin/components/Modal.jsx'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'
import { useToast } from '../../admin/context/ToastContext.jsx'
import Select from '../../shared/components/Select.jsx'
import DatePicker from '../../shared/components/DatePicker.jsx'
import TimePicker from '../../shared/components/TimePicker.jsx'

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
  { route: 'R-01 QC Hall ↔ Cubao', date: 'Oct 22', rating: 4.8 },
  { route: 'R-05 Batasan ↔ Eastwood', date: 'Oct 20', rating: 4.6 },
  { route: 'R-02 QC Hall ↔ Commonwealth', date: 'Oct 18', rating: 4.9 },
]

const normalizeTripDate = (dateValue) => {
  if (!dateValue) return null

  const trimmed = dateValue.trim()

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsedDate = new Date(`${trimmed}T00:00:00`)
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
  }

  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return null
  }

  const [month, day, year] = trimmed.split('/')
  const parsedDate = new Date(`${year}-${month}-${day}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  if (parsedDate.getFullYear() !== Number(year) || parsedDate.getMonth() + 1 !== Number(month) || parsedDate.getDate() !== Number(day)) {
    return null
  }

  return parsedDate
}

const formatTripTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return 'Schedule not set'

  const parsedDate = normalizeTripDate(dateValue)
  if (!parsedDate) return 'Schedule not set'

  const selectedDate = new Date(parsedDate)
  selectedDate.setHours(Number(timeValue.split(':')[0]), Number(timeValue.split(':')[1]))

  const monthDay = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const timeString = selectedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return `${monthDay} · ${timeString}`
}

export default function MyTrip() {
  const { routes, stopsById } = useAdminData()
  const { notify } = useToast()
  const [savedTrips, setSavedTrips] = useState(upcomingTrips)
  const [showTripDetails, setShowTripDetails] = useState(false)
  const [showAddTrip, setShowAddTrip] = useState(false)
  const [selectedRouteId, setSelectedRouteId] = useState('')
  const [tripDraft, setTripDraft] = useState({ date: '', time: '' })
  const [tripErrors, setTripErrors] = useState({})
  const [expandedHistory, setExpandedHistory] = useState('')

  const tripDetails = {
    route: 'R-02 QC Hall ↔ Commonwealth',
    date: 'Today · 7:40 AM',
    from: 'Quezon Memorial Circle',
    to: 'Commonwealth Avenue',
    note: 'Route R-02 · Quezon City Hall to Commonwealth Avenue.',
    status: 'On time',
  }

  const validateTripDraft = () => {
    const nextErrors = {}
    const dateValue = tripDraft.date
    const timeValue = tripDraft.time

    if (!dateValue) {
      nextErrors.date = 'Please choose a date.'
    }

    if (!timeValue) {
      nextErrors.time = 'Please choose a time.'
    }

    if (dateValue && timeValue) {
      const parsedDate = normalizeTripDate(dateValue)
      if (!parsedDate) {
        nextErrors.date = 'Use MM/DD/YYYY format.'
      } else {
        const [hours, minutes] = timeValue.split(':').map(Number)
        const selected = new Date(parsedDate)
        selected.setHours(hours, minutes, 0, 0)
        const now = new Date()

        if (selected <= now) {
          nextErrors.time = 'Please select a future date and time.'
        }
      }
    }

    return nextErrors
  }

  const addSavedTrip = (event) => {
    event.preventDefault()
    const route = routes.find((item) => item.id === selectedRouteId)
    if (!route) {
      notify('Choose a route before saving it.', 'error')
      return
    }

    const nextErrors = validateTripDraft()
    if (Object.keys(nextErrors).length > 0) {
      setTripErrors(nextErrors)
      notify('Please choose a valid future date and time.', 'error')
      return
    }

    if (savedTrips.some((trip) => trip.route.startsWith(`${route.id} `))) {
      notify(`${route.id} is already in your saved trips.`, 'info')
      return
    }

    const routeStops = route.stopIds.map((id) => stopsById[id]).filter(Boolean)
    const timeLabel = formatTripTime(tripDraft.date, tripDraft.time)
    setSavedTrips((items) => [...items, {
      route: `${route.id} ${route.name}`,
      time: timeLabel,
      from: routeStops[0]?.name || 'Route origin',
      to: routeStops[routeStops.length - 1]?.name || 'Route destination',
      status: 'Saved route',
      tone: 'blue',
    }])
    setShowAddTrip(false)
    setSelectedRouteId('')
    setTripDraft({ date: '', time: '' })
    setTripErrors({})
    notify('Route added to saved trips for this session.', 'success')
  }

  return (
    <>
      <PageHeader
        title="My Trip"
        description="Review your upcoming commute, recent trips, and route details in one place."
      />

      <Modal open={showTripDetails} onClose={() => setShowTripDetails(false)} title="Trip details" size="md">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Upcoming trip</p>
                <h3 className="mt-1 text-lg font-black text-navy">{tripDetails.route}</h3>
              </div>
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-green-700">
                {tripDetails.status}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">From</p>
                  <p className="font-semibold text-navy">{tripDetails.from}</p>
                </div>
              </div>
              <div className="flex items-center justify-center text-slate-400">
                <ArrowDown size={18} />
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">To</p>
                  <p className="font-semibold text-navy">{tripDetails.to}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Clock3 size={15} className="text-brand" />
              <span>{tripDetails.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-green-700" />
              <span>Safety check passed</span>
            </div>
          </div>

          <p className="text-sm leading-6 text-slate-600">{tripDetails.note}</p>
        </div>
      </Modal>

      <Modal
        open={showAddTrip}
        onClose={() => {
          setShowAddTrip(false)
          setSelectedRouteId('')
          setTripDraft({ date: '', time: '' })
          setTripErrors({})
        }}
        title="Add trip"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setShowAddTrip(false)
                setSelectedRouteId('')
                setTripDraft({ date: '', time: '' })
                setTripErrors({})
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-trip-form"
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              Save route
            </button>
          </>
        }
      >
        <form id="add-trip-form" onSubmit={addSavedTrip} className="space-y-4">
          <div>
            <label htmlFor="saved-route" className="mb-2 block text-sm font-semibold text-slate-700">Choose a route to save</label>
            <Select id="saved-route" required value={selectedRouteId} onChange={(event) => setSelectedRouteId(event.target.value)} className="rounded-xl border-slate-200 py-2.5">
              <option value="">Select a route...</option>
              {routes.filter((route) => route.status === 'Active').map((route) => (
                <option key={route.id} value={route.id} data-desc={route.name}>{route.id}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Date</span>
              <DatePicker
                value={tripDraft.date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(event) => {
                  setTripDraft((current) => ({ ...current, date: event.target.value }))
                  setTripErrors((current) => ({ ...current, date: '' }))
                }}
                className={`rounded-xl py-2.5 ${tripErrors.date ? 'border-red-300' : 'border-slate-200'}`}
              />
              {tripErrors.date && <span className="mt-1 block text-xs text-red-600">{tripErrors.date}</span>}
            </div>

            <div className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Time</span>
              <TimePicker
                value={tripDraft.time}
                onChange={(event) => {
                  setTripDraft((current) => ({ ...current, time: event.target.value }))
                  setTripErrors((current) => ({ ...current, time: '' }))
                }}
                className={`rounded-xl py-2.5 ${tripErrors.time ? 'border-red-300' : 'border-slate-200'}`}
              />
              {tripErrors.time && <span className="mt-1 block text-xs text-red-600">{tripErrors.time}</span>}
            </div>
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-slate-500">Upcoming trip</p>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                On time
              </span>
            </div>
            <h2 className="mt-1 text-xl font-black text-navy">Today, 7:40 AM</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-navy">
              <span className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2 py-0.5 text-xs font-bold text-fuchsia-700">R-02</span>
              <span className="text-slate-700">QC Hall</span>
              <ArrowRight size={15} className="text-brand" />
              <span className="text-slate-700">Commonwealth</span>
            </div>

            <div className="my-4 border-t border-slate-200" />

            <div className="relative space-y-4">
              <div className="absolute left-[6px] top-3 h-[calc(100%-24px)] border-l-2 border-dashed border-blue-200" />
              <div className="relative flex items-start gap-3">
                <span className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 border-green-500 bg-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Board at</p>
                  <p className="text-sm font-bold text-navy">Quezon Memorial Circle</p>
                </div>
              </div>
              <div className="relative flex items-start gap-3">
                <span className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 border-brand bg-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Get off at</p>
                  <p className="text-sm font-bold text-navy">Commonwealth Avenue</p>
                </div>
              </div>
            </div>

            <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-green-700">
              <ShieldCheck size={15} />
              Safety check passed
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/commuter/live-tracking" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2">
                <Navigation size={16} />
                Track bus
              </Link>
              <button
                type="button"
                onClick={() => setShowTripDetails(true)}
                className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-brand transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
              >
                View details
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-navy">Saved trips</h2>
                <p className="text-sm text-slate-500">Your frequent route patterns</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTrip(true)}
                className="rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-brand/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2"
              >
                Add trip
              </button>
            </div>

            <div className="space-y-3">
              {savedTrips.map((trip) => (
                <div key={trip.route} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-brand/25">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
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
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
                    <span>{trip.from}</span>
                    <ArrowRight size={14} className="text-slate-400" />
                    <span>{trip.to}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Star size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black text-navy">Trip history</h3>
              </div>
            </div>

            <div className="space-y-3">
              {tripHistory.map((trip) => (
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
                        <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-600">
                          <Star size={12} fill="currentColor" /> {trip.rating}
                        </span>
                      </span>
                    </span>
                  </button>
                  {expandedHistory === trip.route && (
                    <p className="mt-3 border-t border-slate-200 pt-2 text-xs leading-5 text-slate-500">
                      You can share feedback from the Feedback page.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
