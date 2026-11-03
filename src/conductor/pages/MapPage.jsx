import { useOutletContext } from 'react-router-dom'
import { Pause, Play, Gauge, MapPin, Clock, Users, Route as RouteIcon, Info } from 'lucide-react'
import Card, { Notice } from '../../admin/components/Card.jsx'
import Button from '../../admin/components/Button.jsx'
import ConductorMap from '../components/ConductorMap.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { VEHICLE, ROUTE, ROUTE_STOPS } from '../data/mock.js'
import { useConductor } from '../context/ConductorContext.jsx'

function Tile({ icon: Icon, label, value }) {
  return (
    <div className="flex min-h-[4.25rem] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand"><Icon size={18} /></span>
      <div className="min-w-0">
        <p className="text-xs leading-4 text-slate-500">{label}</p>
        <p className="break-words text-sm font-semibold leading-5 text-navy">{value}</p>
      </div>
    </div>
  )
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand"><Icon size={18} /></span>
      <div className="min-w-0">
        <p className="text-xs leading-4 text-slate-500">{label}</p>
        <p className="break-words text-sm font-semibold leading-5 text-navy">{value}</p>
      </div>
    </div>
  )
}

function Progress({ pct, label, tone = 'bg-brand' }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function MapPage() {
  const sim = useOutletContext()
  const { settings } = useConductor()
  const { position, nextStop, speed, etaMin, running, setRunning, progress } = sim
  const passengers = VEHICLE.passengers
  const pct = Math.round((passengers / VEHICLE.capacity) * 100)
  const stopsPassed = ROUTE_STOPS.findIndex((s) => s.id === nextStop.id)
  const tripPct = Math.round(progress * 100)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem] xl:grid-cols-[1fr_22rem]">
      <div className="h-[50dvh] min-h-[320px] lg:h-[calc(100vh-8.5rem)]">
        <ConductorMap position={position} nextStopId={nextStop.id} prefs={settings.map} />
      </div>

      <div className="space-y-4 lg:max-h-[calc(100vh-8.5rem)] lg:overflow-y-auto">
        <Card
          title="Vehicle status"
          action={<StatusBadge status={running ? 'Online' : 'Offline'} />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Tile icon={Gauge} label="Speed" value={`${speed} km/h`} />
              <Tile icon={Users} label="Passengers" value={`${passengers} / ${VEHICLE.capacity}`} />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">Seat occupancy</span>
                <span className="font-semibold text-navy">{pct}%</span>
              </div>
              <Progress pct={pct} label="Seat occupancy" tone={pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-green-500'} />
              <p className="mt-1.5 text-xs text-slate-500">{passengers} of {VEHICLE.capacity} seats occupied · {VEHICLE.capacity - passengers} available</p>
            </div>
            <Button variant="secondary" size="sm" icon={running ? Pause : Play} onClick={() => setRunning(!running)} className="w-full">
              {running ? 'Pause simulation' : 'Resume simulation'}
            </Button>
          </div>
        </Card>

        <Card title="Route">
          <div className="space-y-4">
            <div className="divide-y divide-slate-100">
              <Row icon={RouteIcon} label={ROUTE.id} value={ROUTE.name} />
              <Row icon={MapPin} label="Next stop" value={nextStop.name} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Tile icon={Clock} label="Estimated arrival" value={etaMin ? `About ${etaMin} min` : 'Paused'} />
              <Tile icon={RouteIcon} label="Trip progress" value={`${tripPct}%`} />
            </div>
            <div>
              <Progress pct={tripPct} label="Trip progress" />
              <p className="mt-1.5 text-xs text-slate-500">Stop {Math.max(stopsPassed + 1, 1)} of {ROUTE_STOPS.length}</p>
            </div>
          </div>
        </Card>

        <Card title="Location details">
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0"><dt className="text-slate-500">Latitude</dt><dd className="font-mono font-semibold text-navy">{position.lat.toFixed(5)}</dd></div>
            <div className="flex items-center justify-between gap-3 py-2.5"><dt className="text-slate-500">Longitude</dt><dd className="font-mono font-semibold text-navy">{position.lng.toFixed(5)}</dd></div>
            <div className="flex items-center justify-between gap-3 py-2.5 last:pb-0"><dt className="text-slate-500">Vehicle</dt><dd className="font-semibold text-navy">{VEHICLE.plate}</dd></div>
          </dl>
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <Info size={14} className="mt-0.5 shrink-0" /> Position is simulated along the route. It is not a live GPS reading.
          </p>
        </Card>

        {!settings.map.showRoute && !settings.map.showStops && (
          <Notice tone="blue" icon={Info}>Route line and stops are hidden. Turn them on in Settings → Map display.</Notice>
        )}
      </div>
    </div>
  )
}
