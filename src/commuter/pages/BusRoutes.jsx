import { useMemo, useState } from 'react'
import { MapPinned, Search } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'
import { PageHeader } from '../../admin/components/Card.jsx'

const buttonBase = 'rounded-xl px-3 py-2 text-sm font-semibold transition'

export default function BusRoutes() {
  const { routes, stopsById } = useAdminData()
  const [query, setQuery] = useState('')
  const [selectedRouteId, setSelectedRouteId] = useState(routes[0]?.id || '')

  const filteredRoutes = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return routes

    return routes.filter((route) => {
      const haystack = `${route.id} ${route.name} ${route.stopIds.map((id) => stopsById[id]?.name || '').join(' ')}`.toLowerCase()
      return haystack.includes(needle)
    })
  }, [query, routes, stopsById])

  const selectedRoute = filteredRoutes.find((route) => route.id === selectedRouteId) || filteredRoutes[0] || null
  const selectedStops = selectedRoute ? selectedRoute.stopIds.map((id) => stopsById[id]).filter(Boolean) : []

  return (
    <div className="space-y-5">
      <PageHeader title="Bus Routes" description="Explore QC Bus routes, stops, and daily service hours." />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Daily service · Weekdays &amp; weekends · Holiday operations may vary.</p>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center sm:min-w-[250px]">
          <p className="text-xl font-bold leading-tight text-navy sm:text-2xl">6:00 AM – 9:00 PM</p>
          <p className="mt-1.5 text-sm font-medium text-slate-600">Monday – Sunday</p>
          <p className="text-xs text-slate-500">Except on holidays</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <nav className="flex flex-wrap gap-2 text-sm font-bold text-slate-700" aria-label="Route information pages">
              <NavLink to="/commuter/route-and-schedule" className={({ isActive }) => `${buttonBase} ${isActive ? 'bg-brand text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
                Bus Routes
              </NavLink>
              <NavLink to="/commuter/timetable" className={({ isActive }) => `${buttonBase} ${isActive ? 'bg-brand text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
                Timetable
              </NavLink>
            </nav>
          </div>

          <div className="p-4">
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Search size={16} aria-hidden="true" className="text-slate-400" />
              <label htmlFor="route-search" className="sr-only">Search routes or stops</label>
              <input
                id="route-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                placeholder="Search routes or stops"
              />
            </div>

            {filteredRoutes.length ? (
              <div className="space-y-3" role="group" aria-label="Available bus routes">
                {filteredRoutes.map((route) => {
                const isSelected = route.id === selectedRoute?.id
                const short = route.id.replace('R-', '')
                const stops = route.stopIds.map((id) => stopsById[id]).filter(Boolean)

                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => setSelectedRouteId(route.id)}
                    aria-pressed={isSelected}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                      isSelected ? 'border-brand bg-brand/5 shadow-sm' : 'border-slate-200 bg-slate-50 hover:border-brand/30 hover:bg-white'
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: route.color }}>
                      {short}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-bold text-navy">{route.name}</span>
                      <span className="block truncate text-xs text-slate-500">{stops[0]?.name || 'Origin'} → {stops[stops.length - 1]?.name || 'Destination'}</span>
                    </span>
                    <span className="text-xl text-slate-400">›</span>
                  </button>
                )
                })}
              </div>
            ) : (
              <p role="status" className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                {routes.length ? 'No routes or stops match your search.' : 'No bus routes are available right now.'}
              </p>
            )}
          </div>
        </div>

        {selectedRoute ? <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-brand">
                  {selectedRoute?.id?.replace('R-', '') || 'R'}
                </span>
                <span className="text-lg font-bold text-navy">{selectedRoute?.name || 'No route selected'}</span>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
              <MapPinned size={16} className="text-brand" />
              <span>{selectedStops.length} stops</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#dff0ff_0%,#e7f4ea_50%,#cfe7ff_100%)] p-4">
              <svg role="img" aria-label={`Illustration of the ${selectedRoute.name} route`} viewBox="0 0 400 240" className="h-56 w-full rounded-xl bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.75),_rgba(255,255,255,0.15)_60%,_rgba(255,255,255,0)_100%)]">
                <g opacity="0.9">
                  <path d="M20 30 L110 60 L180 50 L240 110 L320 105 L360 190" fill="none" stroke="#dfe7f5" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 30 L110 60 L180 50 L240 110 L320 105 L360 190" fill="none" stroke="#e12645" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
                <g fill="#fff" stroke="#193b70" strokeWidth="2">
                  <circle cx="20" cy="30" r="7" />
                  <circle cx="110" cy="60" r="7" />
                  <circle cx="180" cy="50" r="7" />
                  <circle cx="240" cy="110" r="7" />
                  <circle cx="320" cy="105" r="7" />
                  <circle cx="360" cy="190" r="7" />
                </g>
              </svg>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                Main Stops
              </div>

              {selectedStops.length ? selectedStops.slice(0, 6).map((stop, index) => (
                <div key={stop.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy">{stop.name}</p>
                    <p className="text-xs text-slate-500">{stop.address}</p>
                  </div>
                </div>
              )) : <p role="status" className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">Stop information is not available for this route yet.</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Active Buses</p>
              <p className="mt-1.5 text-2xl font-bold text-navy sm:text-3xl">8</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Frequency</p>
              <p className="mt-1.5 text-2xl font-bold text-navy sm:text-3xl">15–20</p>
              <p className="text-xs text-slate-500 sm:text-sm">minutes</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Trip Duration</p>
              <p className="mt-1.5 text-2xl font-bold text-navy sm:text-3xl">30–45</p>
              <p className="text-xs text-slate-500 sm:text-sm">minutes</p>
            </div>
          </div>
        </div> : (
          <div role="status" className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            Select an available route to see its stops and details.
          </div>
        )}
      </div>
    </div>
  )
}
