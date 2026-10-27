import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock, Gauge, Navigation, Pause, Play, Users } from 'lucide-react'
import { useAdminData } from '../context/AdminDataContext.jsx'
import Card, { PageHeader } from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import Badge from '../components/Badge.jsx'
import MapView from '../components/MapView.jsx'
import OccupancyBar from '../components/OccupancyBar.jsx'
import { inputClass } from '../utils/ui.js'
import { busMarkerStyle, computeBusLive, routeColor } from '../utils/geo.js'
import { BUS_STATUSES } from '../data/constants.js'
import { OCCUPANCY } from '../utils/occupancy.js'

export default function LiveMap() {
  const { buses, routes, stops, accountsById, routesById, stopsById } = useAdminData()
  const [routeF, setRouteF] = useState('')
  const [busF, setBusF] = useState('')
  const [statusF, setStatusF] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [running, setRunning] = useState(true)
  const [progress, setProgress] = useState(() => Object.fromEntries(buses.map((b) => [b.id, b.progress || 0])))

  const dataRef = useRef({ buses, routesById, stopsById })
  useEffect(() => { dataRef.current = { buses, routesById, stopsById } }, [buses, routesById, stopsById])

  // Moves Active buses along their route lines at their set speed (time-lapsed).
  useEffect(() => {
    if (!running) return undefined
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
  }, [running])

  const live = useMemo(
    () =>
      buses
        .filter((b) => (!routeF || b.routeId === routeF) && (!busF || b.id === busF) && (!statusF || b.status === statusF))
        .flatMap((b) => {
          const l = computeBusLive(b, routesById[b.routeId], stopsById, progress[b.id] ?? b.progress ?? 0)
          return l ? [{ bus: b, live: l }] : []
        }),
    [buses, routesById, stopsById, progress, routeF, busF, statusF],
  )

  const shownRoutes = (routeF ? routes.filter((r) => r.id === routeF) : routes.filter((r) => r.status === 'Active'))
    .map((r) => ({ id: r.id, name: r.name, color: routeColor(r.id, r), points: r.stopIds.map((id) => stopsById[id]).filter(Boolean) }))
  const shownStops = routeF
    ? routesById[routeF].stopIds.map((id) => stopsById[id]).filter(Boolean)
    : stops.filter((s) => s.status === 'Active')

  const markers = live.map(({ bus, live: l }) => ({
    id: bus.id, lat: l.lat, lng: l.lng, ...busMarkerStyle(bus), selected: bus.id === selectedId,
    tooltip: `${bus.id} · ${bus.status}`,
  }))

  const sel = live.find((x) => x.bus.id === selectedId)

  return (
    <>
      <PageHeader
        title="Live Bus Map"
        description="Monitor buses, stops, and routes in Quezon City."
        actions={<Button variant={running ? 'secondary' : 'primary'} icon={running ? Pause : Play} onClick={() => setRunning((r) => !r)}>{running ? 'Pause simulation' : 'Resume simulation'}</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
        <select className={inputClass(false)} value={routeF} onChange={(e) => { setRouteF(e.target.value); setBusF('') }} aria-label="Route filter">
          <option value="">Route: All active</option>
          {routes.map((r) => <option key={r.id} value={r.id}>{r.id} · {r.name}</option>)}
        </select>
        <select className={inputClass(false)} value={busF} onChange={(e) => setBusF(e.target.value)} aria-label="Bus filter">
          <option value="">Bus: All</option>
          {buses.filter((b) => !routeF || b.routeId === routeF).map((b) => <option key={b.id} value={b.id}>{b.id}</option>)}
        </select>
        <select className={inputClass(false)} value={statusF} onChange={(e) => setStatusF(e.target.value)} aria-label="Status filter">
          <option value="">Status: All</option>
          {BUS_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <MapView stops={shownStops} routes={shownRoutes} buses={markers} onBusClick={setSelectedId} className="h-[480px] lg:h-[560px]" />
          </div>
          <Card title="QC Bus routes" bodyClass="p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {routes.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { setRouteF(routeF === r.id ? '' : r.id); setBusF('') }}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition hover:bg-slate-50 ${routeF === r.id ? 'border-brand bg-brand/5' : 'border-slate-200'} ${r.status !== 'Active' ? 'opacity-50' : ''}`}
                >
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: routeColor(r.id, r) }} />
                  <span><b className="text-navy">Route {parseInt(r.id.replace(/\D/g, ''), 10)}</b> · {r.name.replace('QC Hall – ', 'QC Hall → ')}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Click a route to isolate it on the map; click again to show all. Large dots mark each route&apos;s terminals.</p>
          </Card>
          <Card title="Legend" bodyClass="p-4">
            <div className="grid gap-x-6 gap-y-2 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
              {Object.values(OCCUPANCY).map((o) => <span key={o.label} className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-full" style={{ background: o.color }} />{o.label}</span>)}
              <span className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-full bg-slate-500" />Inactive / Maintenance (stationary)</span>
              <span className="flex items-center gap-2"><span className="pulse-red flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">!</span>Emergency</span>
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-navy bg-white" />Bus stop</span>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Bus information">
            {sel ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between"><p className="text-lg font-bold text-navy">{sel.bus.id}</p><Badge>{sel.bus.status}</Badge></div>
                <p className="text-slate-600">{routesById[sel.bus.routeId]?.id} · {routesById[sel.bus.routeId]?.name}</p>
                <dl className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-2"><dt className="flex items-center gap-1 text-xs text-slate-500"><Gauge size={13} />Speed</dt><dd className="font-semibold text-navy">{sel.live.speed} km/h</dd></div>
                  <div className="rounded-lg bg-slate-50 p-2"><dt className="flex items-center gap-1 text-xs text-slate-500"><Clock size={13} />Est. arrival</dt><dd className="font-semibold text-navy">{sel.live.etaMin ? `${sel.live.etaMin} min` : '—'}</dd></div>
                </dl>
                <p className="flex items-start gap-1 text-slate-600"><Navigation size={14} className="mt-0.5 shrink-0" /> Next stop: <b className="text-navy">{sel.live.nextStop?.name}</b></p>
                <p className="text-xs text-slate-500">Driver: {accountsById[sel.bus.driverId]?.fullName || 'Unassigned'} · Conductor: {accountsById[sel.bus.conductorId]?.fullName || 'Unassigned'}</p>
                <div><p className="mb-1 flex items-center gap-1 text-xs text-slate-500"><Users size={13} />Passenger occupancy</p><OccupancyBar passengers={sel.bus.passengers} capacity={sel.bus.capacity} /></div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Select a bus marker or a bus from the list to see its details.</p>
            )}
          </Card>

          <Card title={`Buses on map (${live.length})`} bodyClass="p-0">
            {live.length === 0 ? <p className="p-5 text-sm text-slate-500">No buses match the filters.</p> : (
              <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                {live.map(({ bus }) => (
                  <li key={bus.id}>
                    <button type="button" onClick={() => setSelectedId(bus.id)} className={`flex w-full items-center justify-between gap-2 px-5 py-2.5 text-left text-sm hover:bg-slate-50 ${bus.id === selectedId ? 'bg-brand/5' : ''}`}>
                      <span><span className="font-semibold text-navy">{bus.id}</span> <span className="text-xs text-slate-500">{bus.routeId}</span></span>
                      <Badge>{bus.status}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
