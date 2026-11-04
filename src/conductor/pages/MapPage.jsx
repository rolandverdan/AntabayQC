import { useOutletContext } from 'react-router-dom'
import { Gauge, MapPin, Clock, Users, Route as RouteIcon, Info, LocateFixed, CircleStop } from 'lucide-react'
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
  const locationState = useOutletContext()
  const { settings, passengerCount, passengerEntries, passengerExits } = useConductor()
  const { position, nextStop, speed, etaMin, progress, gpsStatus, gpsMessage, gpsAccuracy, gpsUpdatedAt, usePhoneGps, stopPhoneGps } = locationState
  const stopsPassed = nextStop ? ROUTE_STOPS.findIndex((s) => s.id === nextStop.id) : -1
  const tripPct = progress === null ? null : Math.round(progress * 100)
  const etaLabel = etaMin ? `About ${etaMin} min` : 'Unavailable'
  const vehicleStatus = gpsStatus === 'requesting'
    ? 'Connecting'
    : gpsStatus === 'error'
      ? 'GPS unavailable'
      : gpsStatus === 'active'
        ? 'GPS active'
        : 'Location required'

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem] xl:grid-cols-[1fr_22rem]">
      <div className="h-[50dvh] min-h-[320px] lg:h-[calc(100vh-8.5rem)]">
        <ConductorMap position={position} nextStopId={nextStop?.id} prefs={settings.map} gpsStatus={gpsStatus} gpsAccuracy={gpsAccuracy} />
      </div>

      <div className="space-y-4 lg:max-h-[calc(100vh-8.5rem)] lg:overflow-y-auto">
        <Card
          title="Vehicle status"
          action={<StatusBadge status={vehicleStatus} />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Tile icon={Gauge} label="Speed" value={speed === null ? 'Unavailable' : `${Math.round(speed)} km/h`} />
              <Tile icon={Users} label="Passengers onboard" value={String(passengerCount)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Tile icon={Users} label="Entries counted" value={String(passengerEntries)} />
              <Tile icon={Users} label="Exits counted" value={String(passengerExits)} />
            </div>
            <p className="text-xs text-slate-500">Counts update from browser camera doorway detections and are saved only in this browser. Set a starting onboard count on the Camera page.</p>
            {gpsStatus === 'active' ? (
              <Button variant="secondary" size="sm" icon={CircleStop} onClick={stopPhoneGps} className="w-full">
                Stop phone GPS
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                icon={LocateFixed}
                onClick={usePhoneGps}
                disabled={gpsStatus === 'requesting'}
                className="w-full"
              >
                {gpsStatus === 'requesting' ? 'Waiting for phone GPS…' : gpsStatus === 'error' ? 'Retry phone GPS' : 'Enable phone GPS'}
              </Button>
            )}
            {gpsMessage && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{gpsMessage}</p>}
          </div>
        </Card>

        <Card title="Route">
          <div className="space-y-4">
            <div className="divide-y divide-slate-100">
              <Row icon={RouteIcon} label={ROUTE.id} value={ROUTE.name} />
              <Row icon={MapPin} label="Next stop" value={nextStop?.name || 'Unavailable until GPS connects'} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Tile icon={Clock} label="Estimated arrival" value={etaLabel} />
              <Tile icon={RouteIcon} label="Trip progress" value={tripPct === null ? 'Unavailable' : `${tripPct}%`} />
            </div>
            {tripPct !== null ? (
              <div>
                <Progress pct={tripPct} label="Trip progress" />
                <p className="mt-1.5 text-xs text-slate-500">Stop {Math.max(stopsPassed + 1, 1)} of {ROUTE_STOPS.length}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Enable phone GPS to estimate progress against the assigned route.</p>
            )}
          </div>
        </Card>

        <Card title="Location details">
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0"><dt className="text-slate-500">Latitude</dt><dd className="font-mono font-semibold text-navy">{position ? position.lat.toFixed(5) : 'Unavailable'}</dd></div>
            <div className="flex items-center justify-between gap-3 py-2.5"><dt className="text-slate-500">Longitude</dt><dd className="font-mono font-semibold text-navy">{position ? position.lng.toFixed(5) : 'Unavailable'}</dd></div>
            <div className="flex items-center justify-between gap-3 py-2.5 last:pb-0"><dt className="text-slate-500">Vehicle</dt><dd className="font-semibold text-navy">{VEHICLE.plate}</dd></div>
            <div className="flex items-center justify-between gap-3 py-2.5"><dt className="text-slate-500">Source</dt><dd className="font-semibold text-navy">{position ? 'Phone GPS' : 'Unavailable'}</dd></div>
            {position && (
              <>
                <div className="flex items-center justify-between gap-3 py-2.5"><dt className="text-slate-500">Accuracy</dt><dd className="font-semibold text-navy">±{Math.round(gpsAccuracy)} m</dd></div>
                <div className="flex items-center justify-between gap-3 py-2.5 last:pb-0"><dt className="text-slate-500">Last update</dt><dd className="font-semibold text-navy">{new Date(gpsUpdatedAt).toLocaleTimeString()}</dd></div>
              </>
            )}
          </dl>
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <Info size={14} className="mt-0.5 shrink-0" />
            {position
              ? 'Phone GPS is the location source. Route progress and next stop are estimates against the assigned route, not road-snapped navigation.'
              : 'Vehicle location is not available until you enable phone GPS. No fallback position is shown.'}
          </p>
        </Card>

        {!settings.map.showRoute && !settings.map.showStops && (
          <Notice tone="blue" icon={Info}>Route line and stops are hidden. Turn them on in Settings → Map display.</Notice>
        )}
      </div>
    </div>
  )
}
