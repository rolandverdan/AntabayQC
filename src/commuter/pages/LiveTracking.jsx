import { useEffect, useMemo, useRef, useState } from 'react'
import { BusFront, Clock3, Gauge, MapPinned, Users } from 'lucide-react'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'
import MapView from '../../admin/components/MapView.jsx'
import { busMarkerStyle, computeBusLive, routeColor } from '../../admin/utils/geo.js'
import { OCCUPANCY, occupancyLevel } from '../../admin/utils/occupancy.js'
import RouteChip from '../components/RouteChip.jsx'

export default function LiveTracking() {
  const { routes, buses, stopsById, routesById } = useAdminData()
  const [selectedRoute, setSelectedRoute] = useState('all')
  const [selectedBusId, setSelectedBusId] = useState(null)
  const [progress, setProgress] = useState(() => Object.fromEntries(buses.map((b) => [b.id, b.progress || 0])))

  // Active buses creep along their route lines (time-lapsed), same simulation as the admin Live Map.
  const dataRef = useRef({ buses, routesById, stopsById })
  useEffect(() => { dataRef.current = { buses, routesById, stopsById } }, [buses, routesById, stopsById])
  useEffect(() => {
    const t = setInterval(() => {
      const { buses: bs, routesById: rb, stopsById: sb } = dataRef.current
      setProgress((prev) => {
        const next = { ...prev }
        bs.forEach((b) => {
          if (b.status !== 'Active') return
          const cur = prev[b.id] ?? b.progress ?? 0
          const live = computeBusLive(b, rb[b.routeId], sb, cur)
          if (live) next[b.id] = (cur + (live.speed * 0.0125) / live.routeLengthKm) % 1
        })
        return next
      })
    }, 1500)
    return () => clearInterval(t)
  }, [])

  // Commuters only see buses that are actually running.
  const runningBuses = useMemo(() => buses.filter((b) => b.status === 'Active'), [buses])
  const countFor = (routeId) => runningBuses.filter((b) => b.routeId === routeId).length

  const visible = useMemo(
    () =>
      runningBuses
        .filter((b) => selectedRoute === 'all' || b.routeId === selectedRoute)
        .flatMap((bus) => {
          const live = computeBusLive(bus, routesById[bus.routeId], stopsById, progress[bus.id] ?? bus.progress ?? 0)
          return live ? [{ bus, live }] : []
        }),
    [runningBuses, selectedRoute, routesById, stopsById, progress],
  )

  const selected = visible.find((x) => x.bus.id === selectedBusId) || null
  const focusRoute = selectedRoute === 'all' ? null : routesById[selectedRoute]
  const routeStops = focusRoute ? focusRoute.stopIds.map((id) => stopsById[id]).filter(Boolean) : []

  const shownRoutes = (focusRoute ? [focusRoute] : routes.filter((r) => r.status === 'Active')).map((r) => ({
    id: r.id,
    name: r.name,
    color: routeColor(r.id, r),
    points: r.stopIds.map((id) => stopsById[id]).filter(Boolean),
  }))

  const markers = visible.map(({ bus, live }) => ({
    id: bus.id,
    lat: live.lat,
    lng: live.lng,
    ...busMarkerStyle(bus),
    selected: bus.id === selected?.bus.id,
    tooltip: `${bus.id} · ${routesById[bus.routeId]?.name || bus.routeId}`,
  }))

  const focus = selected ? { lat: selected.live.lat, lng: selected.live.lng, key: selected.bus.id } : null

  const pickRoute = (id) => {
    setSelectedRoute(id)
    setSelectedBusId(null)
  }

  return (
    <div className="space-y-3">
      {/* 1. Pick a route */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <MapPinned size={13} /> Select bus route
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a route">
          <button
            type="button"
            onClick={() => pickRoute('all')}
            aria-pressed={selectedRoute === 'all'}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
              selectedRoute === 'all' ? 'border-brand bg-brand text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-brand/40 hover:text-brand'
            }`}
          >
            All active buses
            <span className={`rounded-full px-1.5 text-[11px] leading-5 ${selectedRoute === 'all' ? 'bg-white/25' : 'bg-white'}`}>{runningBuses.length}</span>
          </button>
          {routes.map((route) => (
            <RouteChip
              key={route.id}
              route={route}
              selected={selectedRoute === route.id}
              count={countFor(route.id)}
              dim={countFor(route.id) === 0}
              onClick={() => pickRoute(route.id)}
            />
          ))}
        </div>
      </div>

      {/* 2. Map */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <BusFront size={16} className="text-brand" />
            {focusRoute ? `${focusRoute.id} · ${focusRoute.name}` : 'All active buses'}
          </p>
          <p className="shrink-0 text-xs font-medium text-slate-500">
            {visible.length} bus{visible.length === 1 ? '' : 'es'} running
          </p>
        </div>
        <div className="h-[46dvh] min-h-[300px] md:h-[460px]">
          <MapView routes={shownRoutes} stops={routeStops} buses={markers} onBusClick={setSelectedBusId} focus={focus} className="h-full" />
        </div>
      </div>

      {/* 3. Buses on this route: pick one */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
        <h2 className="mb-2 text-base font-bold text-navy">
          {focusRoute ? `Buses on ${focusRoute.id}` : 'All active buses'}
          <span className="ml-2 text-sm font-medium text-slate-500">Tap a bus to find it on the map</span>
        </h2>

        {visible.length ? (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map(({ bus, live }) => {
              const route = routesById[bus.routeId]
              const level = OCCUPANCY[occupancyLevel(bus.passengers, bus.capacity)]
              const isSelected = bus.id === selected?.bus.id
              return (
                <li key={bus.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedBusId(isSelected ? null : bus.id)}
                    aria-pressed={isSelected}
                    className={`w-full rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                      isSelected ? 'border-brand bg-brand/5 shadow-sm ring-1 ring-brand/30' : 'border-slate-200 bg-slate-50 hover:border-brand/30 hover:bg-white'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-bold text-navy">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: routeColor(bus.routeId, route) }} />
                        {bus.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{bus.routeId}</span>
                    </span>
                    <span className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                      <Clock3 size={14} className="shrink-0 text-slate-400" />
                      <span className="min-w-0 truncate">
                        Next: {live.nextStop?.name || '—'}{live.etaMin ? ` · ${live.etaMin} min` : ''}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-sm">
                      <Users size={14} className="shrink-0 text-slate-400" />
                      <span className={`font-semibold ${level.text}`}>{level.label}</span>
                    </span>
                    {isSelected && (
                      <span className="mt-2 flex items-center gap-3 border-t border-slate-200 pt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Gauge size={13} /> {live.speed} km/h</span>
                        <span>{bus.passengers}/{bus.capacity} passengers</span>
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm text-slate-500">
            No buses are running on {focusRoute?.id} right now. Try another route or check the Timetable.
          </p>
        )}
      </div>
    </div>
  )
}
