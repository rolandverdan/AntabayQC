import { useMemo, useState } from 'react'
import { Clock, Gauge, MapPin, Navigation, Users } from 'lucide-react'
import { useAdminData } from '../context/AdminDataContext.jsx'
import Card, { PageHeader } from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import MapView from '../components/MapView.jsx'
import OccupancyBar from '../components/OccupancyBar.jsx'
import { busImage, routeColor } from '../utils/geo.js'
import { BUS_STATUSES } from '../data/constants.js'
import { fmtDateTime } from '../utils/format.js'
import Select from '../../shared/components/Select.jsx'

export default function LiveMap() {
  const { buses, routes, stops, accountsById, routesById, stopsById, busLocationsById } = useAdminData()
  const [routeF, setRouteF] = useState('')
  const [busF, setBusF] = useState('')
  const [statusF, setStatusF] = useState('')
  const [pickedId, setSelectedId] = useState('')

  const live = useMemo(() => buses
    .filter((bus) => (!routeF || bus.routeId === routeF) && (!busF || bus.id === busF) && (!statusF || bus.status === statusF))
    .flatMap((bus) => {
      const location = busLocationsById[bus.id]
      if (!location || !Number.isFinite(Number(location.lat)) || !Number.isFinite(Number(location.lng))) return []
      return [{ bus, location }]
    }), [buses, busLocationsById, routeF, busF, statusF])

  const shownRoutes = (routeF ? routes.filter((route) => route.id === routeF) : routes.filter((route) => route.status === 'Active'))
    .map((route) => ({
      id: route.id,
      name: route.name,
      color: routeColor(route.id, route),
      points: route.stopIds.map((id) => stopsById[id]).filter(Boolean),
    }))
  const routeStops = routesById[routeF]?.stopIds
  const shownStops = routeStops
    ? routeStops.map((id) => stopsById[id]).filter(Boolean)
    : stops.filter((stop) => stop.status === 'Active')

  const selectedId = live.some(({ bus }) => bus.id === pickedId) ? pickedId : live[0]?.bus.id || ''
  const selected = live.find(({ bus }) => bus.id === selectedId)
  const markers = live.map(({ bus, location }) => ({
    id: bus.id,
    lat: Number(location.lat),
    lng: Number(location.lng),
    img: busImage(bus.routeId),
    heading: Number(location.heading) || 0,
    color: bus.status === 'Emergency' ? '#dc2626' : bus.status === 'Active' ? '#2563eb' : '#64748b',
    dim: bus.status !== 'Active' && bus.status !== 'Emergency',
    pulse: bus.status === 'Emergency',
    label: bus.id.replace(/^BUS-?/i, ''),
    selected: bus.id === selectedId,
    tooltip: `${bus.id} · ${bus.status}`,
  }))

  const activeCount = buses.filter((bus) => bus.status === 'Active').length
  const emergencyCount = buses.filter((bus) => bus.status === 'Emergency').length
  const averageSpeed = live.filter(({ bus, location }) => bus.status === 'Active' && Number.isFinite(Number(location.speed)))
  const speed = averageSpeed.length
    ? `${Math.round(averageSpeed.reduce((total, item) => total + Number(item.location.speed), 0) / averageSpeed.length)} km/h`
    : 'Unavailable'

  return (
    <div className="flex flex-col">
      <PageHeader title="Live Bus Map" description="Vehicle locations appear here only when a GPS feed is connected." />

      <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        No GPS/device integration is configured. Bus positions, speed, arrival estimates, and passenger counts are not simulated.
      </p>

      <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row">
        <Select value={routeF} onChange={(event) => { setRouteF(event.target.value); setBusF('') }} aria-label="Route filter">
          <option value="">Route: All active</option>
          {routes.map((route) => <option key={route.id} value={route.id}>{route.id} · {route.name}</option>)}
        </Select>
        <Select value={busF} onChange={(event) => setBusF(event.target.value)} aria-label="Bus filter">
          <option value="">Bus: All</option>
          {buses.filter((bus) => !routeF || bus.routeId === routeF).map((bus) => <option key={bus.id} value={bus.id}>{bus.id}</option>)}
        </Select>
        <Select value={statusF} onChange={(event) => setStatusF(event.target.value)} aria-label="Status filter">
          <option value="">Status: All</option>
          {BUS_STATUSES.map((status) => <option key={status}>{status}</option>)}
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="p-1">
              <MapView stops={shownStops} routes={shownRoutes} buses={markers} onBusClick={setSelectedId} className="h-[420px] lg:h-[460px]" />
            </div>
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-600" aria-label="Map legend">
              <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" />Active GPS report</li>
              <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-500" />Inactive / Maintenance</li>
              <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-600" />Emergency status</li>
              <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-2 border-navy bg-white" />Bus stop</li>
            </ul>
          </div>

          <Card title="Routes" bodyClass="p-4">
            {routes.length ? (
              <>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" title="Click a route to isolate it on the map; click again to show all.">
                  {routes.map((route) => (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => { setRouteF(routeF === route.id ? '' : route.id); setBusF('') }}
                      title={route.name}
                      className={`flex h-11 min-w-0 items-center gap-2.5 rounded-lg border px-3 text-left text-xs transition hover:bg-slate-50 ${routeF === route.id ? 'border-brand bg-brand/5 ring-1 ring-brand/30' : 'border-slate-200'} ${route.status !== 'Active' ? 'opacity-60' : ''}`}
                    >
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: routeColor(route.id, route) }} />
                      <span className="min-w-0 flex-1 truncate"><b className="text-navy">{route.id}</b> · {route.name}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">Routes and stops are managed from the admin database.</p>
              </>
            ) : <p className="text-sm text-slate-500">No routes have been added to the database yet.</p>}
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Card title="Bus information" className="shrink-0" bodyClass="p-4" action={selected ? <button type="button" onClick={() => setSelectedId('')} className="text-xs font-semibold text-brand hover:underline">Fleet overview</button> : null}>
            {selected ? (
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex items-center justify-between gap-2"><p className="text-lg font-bold leading-tight text-navy">{selected.bus.id}</p><Badge>{selected.bus.status}</Badge></div>
                  <p className="mt-0.5 text-xs text-slate-500">{routesById[selected.bus.routeId]?.id} · {routesById[selected.bus.routeId]?.name}</p>
                </div>
                <dl className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-lg bg-slate-50 px-3 py-2"><dt className="flex items-center gap-1 text-[11px] text-slate-500"><Gauge size={12} />Speed</dt><dd className="font-bold text-navy">{Number.isFinite(Number(selected.location.speed)) ? `${selected.location.speed} km/h` : 'Unavailable'}</dd></div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2"><dt className="flex items-center gap-1 text-[11px] text-slate-500"><Clock size={12} />Last update</dt><dd className="font-bold text-navy">{selected.location.updatedAt ? fmtDateTime(selected.location.updatedAt) : 'Unavailable'}</dd></div>
                </dl>
                <div>
                  <p className="flex items-center gap-1 text-[11px] text-slate-500"><Navigation size={12} />Next stop</p>
                  <p className="mt-0.5 font-bold leading-snug text-navy">{stopsById[selected.location.nextStopId]?.name || selected.location.nextStopName || 'Unavailable'}</p>
                </div>
                <dl className="grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-3 text-xs">
                  <div><dt className="text-[11px] text-slate-500">Driver</dt><dd className="font-medium text-slate-800">{accountsById[selected.bus.driverId]?.fullName || 'Unassigned'}</dd></div>
                  <div><dt className="text-[11px] text-slate-500">Conductor</dt><dd className="font-medium text-slate-800">{accountsById[selected.bus.conductorId]?.fullName || 'Unassigned'}</dd></div>
                </dl>
                <div>
                  <p className="mb-1 flex items-center gap-1 text-[11px] text-slate-500"><Users size={12} />Passenger occupancy</p>
                  {Number.isFinite(Number(selected.location.passengers)) && selected.bus.capacity
                    ? <OccupancyBar passengers={Number(selected.location.passengers)} capacity={selected.bus.capacity} />
                    : <p className="text-xs text-slate-500">Unavailable until a passenger-counter feed is connected.</p>}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-xs text-slate-500">{live.length ? 'Select a reported bus marker to see details.' : 'No buses are reporting GPS locations.'}</p>
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-navy">Fleet overview</p>
                  <dl className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-slate-50 px-3 py-1.5"><dt className="text-[11px] text-slate-500">Active fleet</dt><dd className="text-base font-bold text-green-700">{activeCount}</dd></div>
                    <div className="rounded-lg bg-slate-50 px-3 py-1.5"><dt className="text-[11px] text-slate-500">GPS reporting</dt><dd className="text-base font-bold text-navy">{live.length}</dd></div>
                    <div className="rounded-lg bg-slate-50 px-3 py-1.5"><dt className="text-[11px] text-slate-500">Emergency status</dt><dd className="text-base font-bold text-red-700">{emergencyCount}</dd></div>
                    <div className="rounded-lg bg-slate-50 px-3 py-1.5"><dt className="text-[11px] text-slate-500">Average speed</dt><dd className="text-base font-bold text-navy">{speed}</dd></div>
                  </dl>
                </div>
                <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={13} />GPS locations update from the busLocations collection when an authorized feed is connected.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
