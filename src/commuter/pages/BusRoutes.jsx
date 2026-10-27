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

  const selectedRoute = filteredRoutes.find((route) => route.id === selectedRouteId) || filteredRoutes[0] || routes[0]
  const selectedStops = selectedRoute ? selectedRoute.stopIds.map((id) => stopsById[id]).filter(Boolean) : []

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bus Routes"
        description={<>
          <span className="md:hidden">Explore QC Bus routes and stops.</span>
          <span className="hidden md:inline">Explore QC Bus routes, stops, and daily service hours.</span>
        </>}
      />

      <div className="hidden flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-500">Daily service · Weekdays &amp; weekends · Holiday operations may vary.</p>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center sm:min-w-[250px]">
          <p className="text-xl font-bold leading-tight text-navy sm:text-2xl">6:00 AM – 9:00 PM</p>
          <p className="mt-1.5 text-sm font-medium text-slate-600">Monday – Sunday</p>
          <p className="text-xs text-slate-500">Except on holidays</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-slate-300 bg-white shadow-sm md:border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex gap-2 text-sm font-bold text-slate-700">
              <NavLink to="/commuter/route-and-schedule" className={({ isActive }) => `${buttonBase} border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${isActive ? 'border-brand bg-brand text-white shadow-sm ring-2 ring-brand/20 md:border-0 md:ring-0' : 'border-slate-300 bg-white text-slate-700 hover:border-brand/40 hover:bg-slate-50 md:border-transparent md:bg-transparent md:text-slate-500 md:hover:border-transparent md:hover:bg-slate-100'}`}>
                Bus Routes
              </NavLink>
              <NavLink to="/commuter/timetable" className={({ isActive }) => `${buttonBase} border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${isActive ? 'border-brand bg-brand text-white shadow-sm ring-2 ring-brand/20 md:border-0 md:ring-0' : 'border-slate-300 bg-white text-slate-700 hover:border-brand/40 hover:bg-slate-50 md:border-transparent md:bg-transparent md:text-slate-500 md:hover:border-transparent md:hover:bg-slate-100'}`}>
                Timetable
              </NavLink>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm md:border-slate-200 md:bg-slate-50 md:shadow-none">
              <Search size={16} className="text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                placeholder="Search routes or stops"
              />
            </div>

            <div className="space-y-3">
              {filteredRoutes.map((route) => {
                const isSelected = route.id === selectedRoute?.id
                const short = route.id.replace('R-', '')
                const stops = route.stopIds.map((id) => stopsById[id]).filter(Boolean)

                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => setSelectedRouteId(route.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? 'border-brand bg-brand/5 shadow-sm ring-2 ring-brand/15 md:ring-0'
                        : 'border-slate-300 bg-white hover:border-brand/40 hover:bg-slate-50 md:border-slate-200 md:bg-slate-50 md:hover:border-brand/30 md:hover:bg-white'
                    }`}
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
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm md:border-slate-200">
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
              <svg viewBox="0 0 400 240" className="h-56 w-full rounded-xl bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.75),_rgba(255,255,255,0.15)_60%,_rgba(255,255,255,0)_100%)]">
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

              {selectedStops.slice(0, 6).map((stop, index) => (
                <div key={stop.id} className="flex items-start gap-3 rounded-xl border border-slate-300 bg-white p-3 md:border-slate-200 md:bg-slate-50">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy">{stop.name}</p>
                    <p className="text-xs text-slate-500">{stop.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="rounded-2xl border border-slate-300 bg-white p-2 text-center shadow-sm sm:p-4 md:border-slate-200">
              <p className="!text-[10px] font-semibold uppercase leading-tight tracking-[0.08em] text-slate-500 sm:!text-xs md:tracking-[0.12em]">Active Buses</p>
              <p className="mt-1.5 !text-lg font-bold text-navy sm:!text-3xl">8</p>
            </div>
            <div className="rounded-2xl border border-slate-300 bg-white p-2 text-center shadow-sm sm:p-4 md:border-slate-200">
              <p className="!text-[10px] font-semibold uppercase leading-tight tracking-[0.08em] text-slate-500 sm:!text-xs md:tracking-[0.12em]">Frequency</p>
              <p className="mt-1.5 !text-lg font-bold text-navy sm:!text-3xl">15–20</p>
              <p className="!text-xs text-slate-500 sm:!text-sm">minutes</p>
            </div>
            <div className="rounded-2xl border border-slate-300 bg-white p-2 text-center shadow-sm sm:p-4 md:border-slate-200">
              <p className="!text-[10px] font-semibold uppercase leading-tight tracking-[0.08em] text-slate-500 sm:!text-xs md:tracking-[0.12em]">Trip Duration</p>
              <p className="mt-1.5 !text-lg font-bold text-navy sm:!text-3xl">30–45</p>
              <p className="!text-xs text-slate-500 sm:!text-sm">minutes</p>
            </div>
          </div>
          <p className="mt-2 hidden text-center !text-xs text-slate-500 md:block">Official City Bus Routes • Quezon City Government (QC Bus System)</p>
        </div>
      </div>
    </div>
  )
}
