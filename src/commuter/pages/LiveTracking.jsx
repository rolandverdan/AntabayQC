import { useMemo, useState } from 'react'
import { BusFront, Clock3, Gauge, MapPinned, Users } from 'lucide-react'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'
import MapView from '../../admin/components/MapView.jsx'
import { busMarkerStyle, routeColor, routeStopMarks } from '../../admin/utils/geo.js'
import { OCCUPANCY, occupancyLevel } from '../../admin/utils/occupancy.js'
import RouteChip from '../components/RouteChip.jsx'

export default function LiveTracking() {
  const { routes, buses, stopsById, routesById, busLocationsById, dataStatus, dataError } = useAdminData()
  const [selectedRoute, setSelectedRoute] = useState('all')
  const [selectedBusId, setSelectedBusId] = useState(null)

  const runningBuses = useMemo(
    () => buses.filter((bus) => {
      const location = busLocationsById[bus.id]
      return location?.tripActive !== false
        && Number.isFinite(location?.lat)
        && Number.isFinite(location?.lng)
    }),
    [buses, busLocationsById],
  )
  const countFor = (routeId) => runningBuses.filter((b) => b.routeId === routeId).length

  const visible = useMemo(
    () =>
      runningBuses
        .filter((b) => selectedRoute === 'all' || b.routeId === selectedRoute)
        .map((bus) => {
          const location = busLocationsById[bus.id]
          const nextStop = stopsById[location.nextStopId] || (location.nextStopName ? { name: location.nextStopName } : null)
          const route = routesById[bus.routeId]
          const nextIndex = route?.stopIds?.indexOf(location.nextStopId)
          const live = {
            lat: Number(location.lat),
            lng: Number(location.lng),
            heading: Number(location.heading) || 0,
            speed: Number.isFinite(location.speed) ? location.speed : null,
            nextStop,
            nextIndex: nextIndex >= 0 ? nextIndex : undefined,
          }
          return { bus, location, live }
        }),
    [runningBuses, selectedRoute, routesById, stopsById, busLocationsById],
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

  // Number the stops of the focused route and show which ones the bus has passed / is heading to.
  const markRoute = selected ? routesById[selected.bus.routeId] : focusRoute
  const refLive = selected?.live || visible.find((x) => x.bus.routeId === markRoute?.id)?.live
  const stopMarks = markRoute ? routeStopMarks(markRoute, refLive) : null
  const markStops = markRoute ? markRoute.stopIds.map((id) => stopsById[id]).filter(Boolean) : []

  const markers = visible.map(({ bus, location, live }) => {
    const hasPassengerCount = Number.isFinite(location.passengers)
    const capacity = Number(bus.capacity)
    const style = busMarkerStyle({
      ...bus,
      passengers: hasPassengerCount ? location.passengers : null,
    }, live)
    return {
      id: bus.id,
      lat: live.lat,
      lng: live.lng,
      ...style,
      color: hasPassengerCount ? style.color : '#64748b',
      pulse: false,
      selected: bus.id === selected?.bus.id,
      tooltip: `${bus.id} · ${routesById[bus.routeId]?.name || bus.routeId}`,
      info: {
        route: `${bus.routeId} · ${routesById[bus.routeId]?.name || 'Route unavailable'}`,
        model: bus.model || 'Unavailable',
        plate: bus.plate || 'Unavailable',
        speed: live.speed === null ? 'Unavailable' : `${live.speed} km/h`,
        passengers: hasPassengerCount
          ? Number.isFinite(capacity) && capacity > 0 ? `${location.passengers} / ${capacity}` : String(location.passengers)
          : 'Unavailable',
        seatsAvailable: hasPassengerCount && Number.isFinite(capacity) && capacity > 0
          ? String(Math.max(0, capacity - location.passengers))
          : 'Unavailable',
        nextStop: live.nextStop?.name || 'Unavailable',
        updatedAt: location.updatedAt
          ? new Date(location.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          : 'Unavailable',
      },
    }
  })

  const focus = selected ? { lat: selected.live.lat, lng: selected.live.lng, key: selected.bus.id } : null
  const mapFitKey = `${routes.length && Object.keys(stopsById).length ? 'ready' : 'loading'}:${selectedRoute}:${selectedBusId || ''}`

  const pickRoute = (id) => {
    setSelectedRoute(id)
    setSelectedBusId(null)
  }

  return (
    <div className="space-y-4">
      {/* 1. Pick a route */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <MapPinned size={13} /> Select bus route
        </p>
        <div className="space-y-3.5" role="group" aria-label="Choose a route">
          <button
            type="button"
            onClick={() => pickRoute('all')}
            aria-pressed={selectedRoute === 'all'}
            className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border px-4 text-base font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
              selectedRoute === 'all' ? 'border-brand bg-brand text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-brand/40 hover:text-brand'
            }`}
          >
            All active buses
            <span className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold ${selectedRoute === 'all' ? 'bg-white/25 text-white' : 'bg-white text-navy ring-1 ring-slate-200'}`}>{runningBuses.length}</span>
          </button>
          {/* Counts sit on each chip's corner so they never take up room beside the route name. */}
          <div className="grid grid-cols-4 gap-x-2.5 gap-y-3.5 pt-1 md:grid-cols-8">
            {routes.map((route) => (
              <RouteChip
                key={route.id}
                route={route}
                selected={selectedRoute === route.id}
                count={countFor(route.id)}
                dim={countFor(route.id) === 0}
                className="w-full justify-center"
                onClick={() => pickRoute(route.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {dataStatus === 'error' && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Live bus data could not be loaded. {dataError}
        </p>
      )}

      {/* 2. Map */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <BusFront size={16} className="text-brand" />
            {focusRoute ? `${focusRoute.id} · ${focusRoute.name}` : 'All active buses'}
          </p>
          {stopMarks && (
            <p className="hidden items-center gap-3 text-[11px] text-slate-500 sm:flex">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-slate-500" />Passed</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-green-600 ring-2 ring-green-600/30" />Next</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full border-2 border-navy bg-white" />Ahead</span>
            </p>
          )}
          <p className="shrink-0 text-xs font-medium text-slate-500">
            {visible.length} live bus{visible.length === 1 ? '' : 'es'}
          </p>
        </div>
        <div className="h-[46dvh] min-h-[300px] md:h-[460px]">
          <MapView routes={shownRoutes} stops={selected && !focusRoute ? markStops : routeStops} stopMarks={stopMarks} buses={markers} onBusClick={setSelectedBusId} focus={focus} fitKey={mapFitKey} roadSnap className="h-full" />
        </div>
      </div>

      {/* 3. Buses on this route: pick one */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
        <h2 className="mb-2 text-base font-bold text-navy">
          {focusRoute ? `Buses on ${focusRoute.id}` : 'All active buses'}
          <span className="ml-2 text-sm font-medium text-slate-500">Tap a bus to find it on the map</span>
        </h2>

        {dataStatus === 'loading' ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm text-slate-500">
            Loading the latest GPS reports…
          </p>
        ) : visible.length ? (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map(({ bus, live }) => {
              const route = routesById[bus.routeId]
              const location = busLocationsById[bus.id]
              const passengers = Number.isFinite(location.passengers) ? location.passengers : null
              const level = passengers === null ? null : OCCUPANCY[occupancyLevel(passengers, bus.capacity)]
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
                        Next stop: {routeStopMarks(route, live)[live.nextStop?.id]?.n ? `#${routeStopMarks(route, live)[live.nextStop.id].n} ` : ''}{live.nextStop?.name || 'Unavailable'}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-sm">
                      <Users size={14} className="shrink-0 text-slate-400" />
                      <span className={`font-semibold ${level?.text || 'text-slate-500'}`}>{level?.label || 'Passenger count unavailable'}</span>
                    </span>
                    {isSelected && (
                      <span className="mt-2 flex items-center gap-3 border-t border-slate-200 pt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Gauge size={13} /> {live.speed === null ? 'Speed unavailable' : `${live.speed} km/h`}</span>
                        <span>{passengers === null ? 'Passenger count unavailable' : `${passengers}/${bus.capacity} passengers`}</span>
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm text-slate-500">
            No conductor trips are currently sharing a GPS location for {focusRoute?.id || 'this service'}.
          </p>
        )}
      </div>
    </div>
  )
}
