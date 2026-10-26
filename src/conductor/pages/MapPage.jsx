import { useOutletContext } from 'react-router-dom'
import { Pause, Play, Gauge, MapPin, Clock, Users, Route as RouteIcon, Info } from 'lucide-react'
import Card, { Notice } from '../../admin/components/Card.jsx'
import Button from '../../admin/components/Button.jsx'
import ConductorMap from '../components/ConductorMap.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { VEHICLE, ROUTE, ROUTE_STOPS } from '../data/mock.js'
import { useConductor } from '../context/ConductorContext.jsx'

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand"><Icon size={18} /></span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="break-words text-sm font-semibold text-navy">{value}</p>
      </div>
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
            <Stat icon={Gauge} label="Speed" value={`${speed} km/h`} />
            <Stat icon={Users} label="Passengers" value={`${passengers} of ${VEHICLE.capacity} seats (${pct}%)`} />
            <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Passenger load" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className={`h-full rounded-full ${pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
            </div>
            <Button variant="secondary" size="sm" icon={running ? Pause : Play} onClick={() => setRunning(!running)} className="w-full">
              {running ? 'Pause simulation' : 'Resume simulation'}
            </Button>
          </div>
        </Card>

        <Card title="Route">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full" style={{ background: ROUTE.color }} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500">{ROUTE.id}</p>
                <p className="text-sm font-semibold text-navy">{ROUTE.name}</p>
              </div>
            </div>
            <Stat icon={MapPin} label="Next stop" value={nextStop.name} />
            <Stat icon={Clock} label="Estimated arrival" value={etaMin ? `About ${etaMin} min` : 'Paused'} />
            <Stat icon={RouteIcon} label="Trip progress" value={`${Math.round(progress * 100)}% · stop ${Math.max(stopsPassed, 1)} of ${ROUTE_STOPS.length}`} />
          </div>
        </Card>

        <Card title="Location details">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Latitude</dt><dd className="font-mono text-navy">{position.lat.toFixed(5)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Longitude</dt><dd className="font-mono text-navy">{position.lng.toFixed(5)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-500">Vehicle</dt><dd className="text-navy">{VEHICLE.plate}</dd></div>
          </dl>
          <div className="mt-3 flex items-start gap-2 text-xs text-slate-500">
            <Info size={14} className="mt-0.5 shrink-0" />
            <p>Position is simulated along the route. It is not a live GPS reading.</p>
          </div>
        </Card>

        {!settings.map.showRoute && !settings.map.showStops && (
          <Notice tone="blue" icon={Info}>Route line and stops are hidden. Turn them on in Settings → Map display.</Notice>
        )}
      </div>
    </div>
  )
}
