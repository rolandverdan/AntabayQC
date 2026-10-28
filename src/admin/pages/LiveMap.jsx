import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock, Gauge, Navigation, Users } from 'lucide-react'
import { useAdminData } from '../context/AdminDataContext.jsx'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import MapView from '../components/MapView.jsx'
import OccupancyBar from '../components/OccupancyBar.jsx'
import { inputClass } from '../utils/ui.js'
import { busMarkerStyle, computeBusLive, routeColor } from '../utils/geo.js'
import { BUS_STATUSES } from '../data/constants.js'
import { OCCUPANCY, occupancyLevel } from '../utils/occupancy.js'

export default function LiveMap() {
  const { buses, routes, stops, accountsById, routesById, stopsById } = useAdminData()
  const [routeF, setRouteF] = useState('')
  const [busF, setBusF] = useState('')
  const [statusF, setStatusF] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [progress, setProgress] = useState(() => Object.fromEntries(buses.map((b) => [b.id, b.progress || 0])))

  const dataRef = useRef({ buses, routesById, stopsById })
  useEffect(() => { dataRef.current = { buses, routesById, stopsById } }, [buses, routesById, stopsById])

  // Moves Active buses along their route lines at their set speed (time-lapsed).
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

  const count = (st) => live.filter((x) => x.bus.status === st).length
  const activeLive = live.filter((x) => x.bus.status === 'Active')
  const avgSpeed = activeLive.length ? Math.round(activeLive.reduce((n, x) => n + (x.live.speed || 0), 0) / activeLive.length) : 0
  const occ = { green: 0, yellow: 0, red: 0 }
  activeLive.forEach((x) => { occ[occupancyLevel(x.bus.passengers, x.bus.capacity)] += 1 })
  const overview = [
    { label: 'Active', value: count('Active'), tone: 'text-green-700' },
    { label: 'Maintenance / Inactive', value: count('Maintenance') + count('Inactive'), tone: 'text-slate-600' },
    { label: 'Emergency', value: count('Emergency'), tone: 'text-red-700' },
    { label: 'Avg. speed (active)', value: `${avgSpeed} km/h`, tone: 'text-navy' },
  ]

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-5.75rem)] lg:min-h-[520px]">
      <p className="mb-3 text-sm text-slate-500">Monitor buses, stops, and routes in Quezon City.</p>

      <div className="mb-3 flex shrink-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
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

      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-3 lg:min-h-0">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-sm lg:min-h-[280px] lg:flex-1">
            <MapView stops={shownStops} routes={shownRoutes} buses={markers} onBusClick={setSelectedId} className="h-[420px] lg:h-full" />
          </div>
          {/* Routes (narrower) and Legend share one row so there is no empty space on the right. */}
          <div className="grid shrink-0 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Card title="QC Bus routes" bodyClass="p-3">
              <div className="flex flex-wrap gap-1.5" title="Click a route to isolate it on the map; click again to show all.">
                {routes.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setRouteF(routeF === r.id ? '' : r.id); setBusF('') }}
                    title={r.name}
                    className={`flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-left text-[11px] transition hover:bg-slate-50 ${routeF === r.id ? 'border-brand bg-brand/5' : 'border-slate-200'} ${r.status !== 'Active' ? 'opacity-60' : ''}`}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: routeColor(r.id, r) }} />
                    <span className="truncate"><b className="text-navy">Route {parseInt(r.id.replace(/\D/g, ''), 10)}</b> · {r.name.replace('QC Hall – ', 'QC Hall → ')}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-500">Click a route to isolate it on the map; click again to show all.</p>
            </Card>
            <Card title="Legend" bodyClass="p-3">
              <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-[11px] text-slate-600 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                {Object.values(OCCUPANCY).map((o) => <li key={o.label} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: o.color }} />{o.label}</li>)}
                <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-500" />Inactive / Maintenance</li>
                <li className="flex items-center gap-1.5"><span className="pulse-red flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white">!</span>Emergency</li>
                <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-navy bg-white" />Bus stop</li>
              </ul>
            </Card>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:min-h-0">
          {/* Fixed height so the panel never jumps between "nothing selected" and "bus selected". */}
          <Card title="Bus information" className="shrink-0" bodyClass="h-[19rem] overflow-hidden p-5">
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
              <div className="space-y-3 text-sm">
                <p className="text-slate-500">Select a bus marker or a bus from the list to see its details.</p>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Fleet on map ({live.length})</p>
                  <dl className="grid grid-cols-2 gap-2">
                    {overview.map((o) => (
                      <div key={o.label} className="rounded-lg bg-slate-50 p-2">
                        <dt className="truncate text-xs text-slate-500">{o.label}</dt>
                        <dd className={`text-lg font-bold leading-tight ${o.tone}`}>{o.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Occupancy (active buses)</p>
                  <ul className="space-y-1">
                    {Object.entries(OCCUPANCY).map(([k, o]) => (
                      <li key={k} className="flex items-center justify-between rounded-lg border border-slate-100 px-2.5 py-1 text-xs">
                        <span className="flex items-center gap-2 text-slate-700"><span className="h-2.5 w-2.5 rounded-full" style={{ background: o.color }} />{o.label}</span>
                        <span className="font-bold text-navy">{occ[k]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Card>

          <Card title={`Buses on map (${live.length})`} className="flex min-h-0 flex-col lg:flex-1" bodyClass="min-h-0 p-0 lg:flex-1 lg:overflow-y-auto">
            {live.length === 0 ? <p className="p-5 text-sm text-slate-500">No buses match the filters.</p> : (
              <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto lg:max-h-none lg:overflow-visible">
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
    </div>
  )
}
