import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'
import MapView from '../../admin/components/MapView.jsx'
import { routeColor } from '../../admin/utils/geo.js'
import RouteChip, { readableOn } from '../components/RouteChip.jsx'
import RouteTabs from '../components/RouteTabs.jsx'

export default function BusRoutes() {
  const { routes, stopsById, buses } = useAdminData()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '') // Home's quick search lands here with ?q=
  const [selectedRouteId, setSelectedRouteId] = useState('')

  const filteredRoutes = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return routes
    return routes.filter((route) => {
      const haystack = `${route.id} ${route.name} ${route.stopIds.map((id) => stopsById[id]?.name || '').join(' ')}`.toLowerCase()
      return haystack.includes(needle)
    })
  }, [query, routes, stopsById])

  const selectedRoute = filteredRoutes.find((route) => route.id === selectedRouteId) || filteredRoutes[0]
  const selectedStops = selectedRoute ? selectedRoute.stopIds.map((id) => stopsById[id]).filter(Boolean) : []
  const color = selectedRoute ? routeColor(selectedRoute.id, selectedRoute) : '#244A9B'
  const activeOnRoute = selectedRoute ? buses.filter((b) => b.routeId === selectedRoute.id && b.status === 'Active').length : 0

  const origin = selectedStops[0]?.name || 'Origin'
  const destination = selectedStops[selectedStops.length - 1]?.name || 'Destination'

  return (
    <div className="space-y-3">
      <RouteTabs />

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 focus-within:border-brand/40">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-9 w-full min-w-0 border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            placeholder="Search routes or stops"
            aria-label="Search routes or stops"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Choose a route">
          {filteredRoutes.map((route) => (
            <RouteChip key={route.id} route={route} selected={route.id === selectedRoute?.id} onClick={() => setSelectedRouteId(route.id)} />
          ))}
          {!filteredRoutes.length && <p className="py-1 text-sm text-slate-500">No route or stop matches “{query}”.</p>}
        </div>
      </div>

      {selectedRoute && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold" style={{ background: color, color: readableOn(color) }}>
              {selectedRoute.id.replace('R-', '')}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold leading-tight text-navy">{selectedRoute.name}</h2>
              <p className="truncate text-xs text-slate-500">{origin} → {destination} · {selectedStops.length} stops</p>
            </div>
          </div>

          {/* Map and stop list share one height on desktop so both columns end together. */}
          <div className="grid grid-cols-1 gap-4 lg:h-[26rem] lg:grid-cols-[1.25fr_1fr]">
            <div className="flex min-h-0 flex-col gap-2">
              <div className="relative h-64 overflow-hidden rounded-xl border border-slate-200 lg:h-auto lg:flex-1">
                <MapView
                  routes={[{ id: selectedRoute.id, name: selectedRoute.name, color, points: selectedStops }]}
                  stops={selectedStops}
                  scrollWheelZoom={false}
                  terminalLabels
                  className="h-full"
                />
              </div>
              {/* Small indicators after the map instead of three big cards */}
              <dl className="grid grid-cols-3 gap-2 text-center">
                {[
                  ['Active buses', activeOnRoute],
                  ['Every', '15–20 min'],
                  ['Trip time', '30–45 min'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
                    <dd className="text-sm font-bold text-navy">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex min-h-0 flex-col">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Stops in order</h3>
              <ol className="max-h-80 min-h-0 flex-1 overflow-y-auto pr-1 lg:max-h-none">
                {selectedStops.map((stop, index) => {
                  const terminal = index === 0 || index === selectedStops.length - 1
                  return (
                    <li key={stop.id} className="relative flex gap-3 pb-3 last:pb-0">
                      {index < selectedStops.length - 1 && <span className="absolute left-[11px] top-6 h-full w-0.5" style={{ background: `${color}55` }} />}
                      <span
                        className="relative z-[1] mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                        style={terminal ? { background: color, color: readableOn(color) } : { background: '#fff', color: '#193B70', border: `2px solid ${color}` }}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-snug text-navy">
                          {stop.name}
                          {terminal && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase text-slate-500">{index === 0 ? 'Start' : 'End'}</span>}
                        </p>
                        <p className="text-xs text-slate-500">{stop.address}</p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
