import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock, Gauge, Navigation, Users } from 'lucide-react'
import { useAdminData } from '../context/AdminDataContext.jsx'
import Card, { PageHeader } from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import MapView from '../components/MapView.jsx'
import OccupancyBar from '../components/OccupancyBar.jsx'
import { busMarkerStyle, computeBusLive, routeColor, routeStopMarks } from '../utils/geo.js'
import { BUS_STATUSES } from '../data/constants.js'
import { OCCUPANCY, occupancyLevel } from '../utils/occupancy.js'
import Select from '../../shared/components/Select.jsx'

export default function LiveMap() {
  const { buses, routes, stops, accountsById, routesById, stopsById } = useAdminData()
  const [routeF, setRouteF] = useState('')
  const [busF, setBusF] = useState('')
  const [statusF, setStatusF] = useState('')
  const [pickedId, setSelectedId] = useState(null) // null = default to first active bus, '' = fleet overview
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

  const defaultId = (live.find((x) => x.bus.status === 'Active') || live[0])?.bus.id || ''
  const selectedId = pickedId === '' ? '' : live.some((x) => x.bus.id === pickedId) ? pickedId : defaultId

  const markers = live.map(({ bus, live: l }) => ({
    id: bus.id, lat: l.lat, lng: l.lng, ...busMarkerStyle(bus, l), selected: bus.id === selectedId,
    tooltip: `${bus.id} · ${bus.status}`,
  }))

  const sel = live.find((x) => x.bus.id === selectedId)

  // Number the stops of the selected bus's route (or the isolated route) and mark passed / next.
  const markRoute = sel ? routesById[sel.bus.routeId] : routeF ? routesById[routeF] : null
  const refLive = sel?.live || live.find((x) => x.bus.routeId === routeF && x.bus.status === 'Active')?.live
  const stopMarks = markRoute ? routeStopMarks(markRoute, refLive) : null
  const nextMark = sel?.live.nextStop ? stopMarks?.[sel.live.nextStop.id] : null

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
    <div className="flex flex-col">
      <PageHeader title="Live Bus Map" description="Monitor buses, stops, and routes in Quezon City." />

      <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row">
        <Select value={routeF} onChange={(e) => { setRouteF(e.target.value); setBusF('') }} aria-label="Route filter">
          <option value="">Route: All active</option>
          {routes.map((r) => <option key={r.id} value={r.id}>{r.id} · {r.name}</option>)}
        </Select>
        <Select value={busF} onChange={(e) => setBusF(e.target.value)} aria-label="Bus filter">
          <option value="">Bus: All</option>
          {buses.filter((b) => !routeF || b.routeId === routeF).map((b) => <option key={b.id} value={b.id}>{b.id}</option>)}
        </Select>
        <Select value={statusF} onChange={(e) => setStatusF(e.target.value)} aria-label="Status filter">
          <option value="">Status: All</option>
          {BUS_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="p-1"><MapView stops={shownStops} routes={shownRoutes} stopMarks={stopMarks} buses={markers} onBusClick={setSelectedId} className="h-[420px] lg:h-[460px]" /></div>
            {/* Compact legend: one wrapped row under the map instead of its own card. */}
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-600" aria-label="Map legend">
              {Object.values(OCCUPANCY).map((o) => <li key={o.label} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: o.color }} />{o.label}</li>)}
              <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-500" />Inactive / Maintenance</li>
              <li className="flex items-center gap-1.5"><span className="pulse-red flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white">!</span>Emergency</li>
              <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-navy bg-white" />Bus stop</li>
              {stopMarks && (
                <>
                  <li className="flex items-center gap-1.5"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-500 text-[9px] font-bold text-white">1</span>Passed</li>
                  <li className="flex items-center gap-1.5"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-600 text-[9px] font-bold text-white ring-2 ring-green-600/30">2</span>Next stop</li>
                  <li className="flex items-center gap-1.5"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-navy bg-white text-[9px] font-bold text-navy">3</span>Upcoming</li>
                </>
              )}
            </ul>
          </div>
          <Card title="QC Bus routes" bodyClass="p-4">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" title="Click a route to isolate it on the map; click again to show all.">
              {routes.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { setRouteF(routeF === r.id ? '' : r.id); setBusF('') }}
                  title={r.name}
                  className={`flex h-11 min-w-0 items-center gap-2.5 rounded-lg border px-3 text-left text-xs transition hover:bg-slate-50 ${routeF === r.id ? 'border-brand bg-brand/5 ring-1 ring-brand/30' : 'border-slate-200'} ${r.status !== 'Active' ? 'opacity-60' : ''}`}
                >
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: routeColor(r.id, r) }} />
                  <span className="min-w-0 flex-1 truncate"><b className="text-navy">Route {parseInt(r.id.replace(/\D/g, ''), 10)}</b> · {r.name.replace('QC Hall – ', 'QC Hall → ')}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Click a route to isolate it on the map; click again to show all.</p>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Card title="Bus information" className="shrink-0" bodyClass="p-4" action={sel ? <button type="button" onClick={() => setSelectedId('')} className="text-xs font-semibold text-brand hover:underline">Fleet overview</button> : null}>
            {sel ? (
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex items-center justify-between gap-2"><p className="text-lg font-bold leading-tight text-navy">{sel.bus.id}</p><Badge>{sel.bus.status}</Badge></div>
                  <p className="mt-0.5 text-xs text-slate-500">{routesById[sel.bus.routeId]?.id} · {routesById[sel.bus.routeId]?.name}</p>
                </div>
                <dl className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-lg bg-slate-50 px-3 py-2"><dt className="flex items-center gap-1 text-[11px] text-slate-500"><Gauge size={12} />Speed</dt><dd className="font-bold text-navy">{sel.live.speed} km/h</dd></div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2"><dt className="flex items-center gap-1 text-[11px] text-slate-500"><Clock size={12} />Est. arrival</dt><dd className="font-bold text-navy">{sel.live.etaMin ? `${sel.live.etaMin} min` : '—'}</dd></div>
                </dl>
                <div>
                  <p className="flex items-center gap-1 text-[11px] text-slate-500"><Navigation size={12} />Next stop{nextMark ? ` · stop ${nextMark.n} of ${nextMark.total}` : ''}</p>
                  <p className="mt-0.5 flex items-start gap-1.5 font-bold leading-snug text-navy">
                    {nextMark && <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-[11px] text-white">{nextMark.n}</span>}
                    {sel.live.nextStop?.name || '—'}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-3 text-xs">
                  <div><dt className="text-[11px] text-slate-500">Driver</dt><dd className="font-medium text-slate-800">{accountsById[sel.bus.driverId]?.fullName || 'Unassigned'}</dd></div>
                  <div><dt className="text-[11px] text-slate-500">Conductor</dt><dd className="font-medium text-slate-800">{accountsById[sel.bus.conductorId]?.fullName || 'Unassigned'}</dd></div>
                </dl>
                <div><p className="mb-1 flex items-center gap-1 text-[11px] text-slate-500"><Users size={12} />Passenger occupancy</p><OccupancyBar passengers={sel.bus.passengers} capacity={sel.bus.capacity} /></div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-xs text-slate-500">Select a bus marker or a bus from the list to see its details.</p>
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-navy">Fleet on map ({live.length})</p>
                  <dl className="grid grid-cols-2 gap-2">
                    {overview.map((o) => (
                      <div key={o.label} className="rounded-lg bg-slate-50 px-3 py-1.5">
                        <dt className="truncate text-[11px] text-slate-500">{o.label}</dt>
                        <dd className={`text-base font-bold leading-tight ${o.tone}`}>{o.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-navy">Occupancy (active buses)</p>
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

          <Card title={`Buses on map (${live.length})`} bodyClass="p-0">
            {live.length === 0 ? <p className="p-4 text-sm text-slate-500">No buses match the filters.</p> : (
              <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {live.map(({ bus }) => (
                  <li key={bus.id}>
                    <button type="button" onClick={() => setSelectedId(bus.id)} className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm hover:bg-slate-50 ${bus.id === selectedId ? 'bg-brand/5' : ''}`}>
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
