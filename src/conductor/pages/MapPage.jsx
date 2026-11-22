import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Gauge, MapPin, Clock, Users, Route as RouteIcon, Info, LocateFixed, CloudUpload, Minus, Plus, Play, Flag, X } from 'lucide-react'
import Card, { Notice } from '../../admin/components/Card.jsx'
import Button from '../../admin/components/Button.jsx'
import ConductorMap from '../components/ConductorMap.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import ConfirmDialog from '../../admin/components/ConfirmDialog.jsx'
import { useConductor } from '../context/ConductorContext.jsx'
import { capacityStatus } from '../utils/capacity.js'
import { haversineKm } from '../../admin/utils/geo.js'
import { routeProgressForPosition } from '../utils/useVehicleLocation.js'

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

// Plain-language state of the live feed to the admin side.
function feedSummary(feed, gpsActive, tripActive) {
  const { assignment, send } = feed
  if (assignment.status === 'loading') return { badge: 'Connecting', text: 'Looking up your assigned bus…' }
  if (assignment.status === 'no-account') return { badge: 'Error', text: 'This login is not linked to a conductor staff account. Ask an admin to create it in Accounts.' }
  if (assignment.status === 'no-bus') return { badge: 'Offline', text: 'No bus is assigned to you yet, so nothing is sent. Ask an admin to assign one in Buses.' }
  if (assignment.status === 'error') return { badge: 'Error', text: `Could not look up your bus: ${assignment.error}` }
  if (assignment.status !== 'ready') return { badge: 'Offline', text: 'Sign in to send live updates.' }
  if (!tripActive) return { badge: 'Offline', text: 'Not sharing. Start a trip to share your location and passenger count with admin and commuters.' }
  if (send.status === 'error') return { badge: 'Error', text: send.error }
  if (send.status === 'sending' && send.lastSentAt === null) return { badge: 'Connecting', text: 'Sending the first update… If this stays, check that mobile data is on.' }
  if (send.status === 'sending') return { badge: 'Connecting', text: 'Sending… If this stays, mobile data may be off or weak; updates are kept and sent when it returns.' }
  if (send.lastSentAt === null) return { badge: 'Connecting', text: 'Preparing the first update…' }
  return {
    badge: 'Online',
    text: `Last sent ${new Date(send.lastSentAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}. ${gpsActive ? 'Location and passenger count are shared.' : 'Only the passenger count is shared until phone GPS connects.'}`,
  }
}

function formatDuration(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours ? `${hours} h ${minutes} min` : `${minutes} min`
}

const clockTime = (time) => new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

// Start/End trip. While a trip runs, phone GPS is on and the live feed is shared.
// The door cameras are separate: they keep their own Start/Stop buttons on the Camera page.
function TripCard({ trip, gpsStatus, gpsMessage, usePhoneGps, canStart }) {
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!trip.active) return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 15000)
    return () => window.clearInterval(timer)
  }, [trip.active])
  const elapsed = trip.active && trip.startedAt ? Math.max(now, trip.startedAt) - trip.startedAt : 0
  const gpsTrouble = trip.active && (gpsStatus === 'error' || gpsStatus === 'idle')

  return (
    <Card title="Trip" action={<StatusBadge status={trip.active ? 'Online' : 'Offline'} />}>
      {trip.active ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Running since <span className="font-semibold text-navy">{clockTime(trip.startedAt)}</span> · {formatDuration(elapsed)}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-slate-50 p-2.5">
              <p className="text-xs text-slate-500">Distance</p>
              <p className="mt-0.5 font-bold text-navy">{trip.distanceKm.toFixed(1)} km</p>
            </div>
            <div className="rounded-lg bg-green-50 p-2.5">
              <p className="text-xs text-green-800">Boarded</p>
              <p className="mt-0.5 font-bold text-green-900">{trip.boarded}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2.5">
              <p className="text-xs text-amber-800">Alighted</p>
              <p className="mt-0.5 font-bold text-amber-900">{trip.alighted}</p>
            </div>
          </div>
          {gpsTrouble && (
            <div role="alert" className="space-y-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <p>{gpsMessage || 'Phone GPS is off, so your location is not being shared.'}</p>
              <Button variant="secondary" size="sm" icon={LocateFixed} onClick={usePhoneGps}>Turn GPS back on</Button>
            </div>
          )}
          {gpsStatus === 'requesting' && <p role="status" className="text-xs text-slate-500">Waiting for phone GPS…</p>}
          <Button variant="danger" icon={Flag} onClick={() => setConfirmEnd(true)} className="w-full">End trip</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {trip.summary && (
            <div className="relative rounded-lg border border-slate-200 bg-slate-50 p-3 pr-9 text-sm">
              <button type="button" onClick={trip.dismissSummary} className="absolute right-2 top-2 rounded p-1 text-slate-500 hover:bg-slate-200" aria-label="Dismiss last trip summary">
                <X size={14} />
              </button>
              <p className="font-semibold text-navy">Last trip</p>
              <p className="mt-0.5 text-xs text-slate-600">
                {clockTime(trip.summary.startedAt)} – {clockTime(trip.summary.endedAt)} · {formatDuration(trip.summary.endedAt - trip.summary.startedAt)}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {trip.summary.distanceKm.toFixed(1)} km · {trip.summary.boarded} boarded · {trip.summary.alighted} alighted
              </p>
            </div>
          )}
          <p className="text-sm text-slate-600">Start a trip when the bus leaves. Your location and passenger count are shared with admin and commuters until you end it.</p>
          <Button icon={Play} onClick={trip.startTrip} disabled={!canStart} className="w-full">Start trip</Button>
          {!canStart && <p className="text-xs text-slate-500">You can start a trip once an admin assigns you a bus.</p>}
        </div>
      )}
      <ConfirmDialog
        open={confirmEnd}
        title="End this trip?"
        message="Location sharing and phone GPS will stop. The door cameras keep running until you stop them on the Camera page."
        confirmLabel="End trip"
        tone="danger"
        onConfirm={() => { setConfirmEnd(false); trip.endTrip() }}
        onCancel={() => setConfirmEnd(false)}
      />
    </Card>
  )
}

export default function MapPage() {
  const locationState = useOutletContext()
  const { settings, passengerCount, passengerEntries, passengerExits, adjustPassengerCount } = useConductor()
  const { position, speed, gpsStatus, gpsMessage, gpsAccuracy, gpsUpdatedAt, usePhoneGps, feed, trip } = locationState
  const feedState = feedSummary(feed, gpsStatus === 'active', trip.active)
  const load = capacityStatus(passengerCount, feed.assignment.bus?.capacity)
  const feedBus = feed.assignment.bus
  const route = feed.route
  const routeStops = feed.routeStops || []
  const nextStop = feed.nextStop
  const progress = position && route ? routeProgressForPosition(position, routeStops) : null
  const etaMin = position && nextStop && speed > 0
    ? Math.max(1, Math.round((haversineKm(position, nextStop) / speed) * 60))
    : null
  const stopsPassed = nextStop ? routeStops.findIndex((s) => s.id === nextStop.id) : -1
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
      <div className="relative h-[50dvh] min-h-[320px] lg:h-[calc(100vh-8.5rem)]">
        <ConductorMap position={position} route={route} routeStops={routeStops} nextStopId={nextStop?.id} prefs={settings.map} gpsStatus={gpsStatus} gpsAccuracy={gpsAccuracy} />
        {/* Passenger counter floats on the map so − / + are always on screen with it. */}
        <div className="absolute bottom-7 left-3 z-[600] flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-md">
          <Button variant="secondary" size="sm" icon={Minus} onClick={() => adjustPassengerCount(-1)} disabled={passengerCount === 0} aria-label="Remove one passenger" className="h-11 w-11 shrink-0" />
          <div className="min-w-[4.5rem] text-center" role="status" aria-label={`${passengerCount} passengers onboard, ${load.label}`}>
            <p className="text-lg font-bold leading-5 text-navy">
              {passengerCount}
              {load.limit && <span className="text-xs font-semibold text-slate-500">/{load.limit}</span>}
            </p>
            <span className={`mt-0.5 inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-semibold leading-4 ring-1 ring-inset ${load.badge}`}>{load.label}</span>
          </div>
          <Button variant="secondary" size="sm" icon={Plus} onClick={() => adjustPassengerCount(1)} aria-label="Add one passenger" className="h-11 w-11 shrink-0" />
        </div>
      </div>

      <div className="space-y-4 lg:max-h-[calc(100vh-8.5rem)] lg:overflow-y-auto">
        <TripCard trip={trip} gpsStatus={gpsStatus} gpsMessage={gpsMessage} usePhoneGps={usePhoneGps} canStart={feed.assignment.status === 'ready'} />

        <Card
          title="Vehicle status"
          action={<StatusBadge status={vehicleStatus} />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Tile icon={Gauge} label="Speed" value={speed === null ? 'Unavailable' : `${Math.round(speed)} km/h`} />
              <Tile icon={Users} label="Entries / exits" value={`${passengerEntries} in · ${passengerExits} out`} />
            </div>
          </div>
        </Card>

        <Card title="Live feed to admin" action={<StatusBadge status={feedState.badge} />}>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand"><CloudUpload size={18} /></span>
              <div className="min-w-0">
                <p className="text-xs leading-4 text-slate-500">Assigned bus</p>
                <p className="break-words font-semibold leading-5 text-navy">{feedBus ? `${feedBus.id}${feedBus.plate ? ` · ${feedBus.plate}` : ''}` : 'None'}</p>
              </div>
            </div>
            <p role="status" className="text-xs text-slate-600">{feedState.text}</p>
          </div>
        </Card>

        <Card title="Route">
          <div className="space-y-4">
            <div className="divide-y divide-slate-100">
              <Row icon={RouteIcon} label={route?.id || 'Assigned route'} value={route?.name || (feed.assignment.status === 'loading' ? 'Loading assignment…' : feedBus?.routeId ? 'Loading route…' : 'No route assigned')} />
              <Row icon={MapPin} label="Next stop" value={nextStop?.name || (route ? 'Unavailable until GPS connects' : 'Unavailable')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Tile icon={Clock} label="Estimated arrival" value={etaLabel} />
              <Tile icon={RouteIcon} label="Trip progress" value={tripPct === null ? 'Unavailable' : `${tripPct}%`} />
            </div>
            {tripPct !== null ? (
              <div>
                <Progress pct={tripPct} label="Trip progress" />
                <p className="mt-1.5 text-xs text-slate-500">Stop {Math.max(stopsPassed + 1, 1)} of {routeStops.length}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">{route ? 'Start a trip to estimate progress against the assigned route.' : 'Trip progress is unavailable until a route is assigned.'}</p>
            )}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-500">Stops in this route</p>
              {routeStops.length ? (
                <ol className="max-h-52 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-100">
                  {routeStops.map((stop, index) => {
                    const isNext = stop.id === nextStop?.id
                    return (
                      <li key={stop.id} className={`flex items-center gap-2 px-3 py-2 text-sm ${isNext ? 'bg-amber-50 font-semibold text-navy' : 'text-slate-700'}`}>
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${isNext ? 'bg-amber-400 text-navy' : 'bg-brand text-white'}`}>{index + 1}</span>
                        <span className="min-w-0 flex-1">{stop.name || stop.id}</span>
                        {isNext && <span className="shrink-0 text-[10px] font-semibold uppercase text-amber-800">Next</span>}
                      </li>
                    )
                  })}
                </ol>
              ) : (
                <p className="text-xs text-slate-500">No stops are available for the assigned route.</p>
              )}
            </div>
          </div>
        </Card>

        <Card title="Location details">
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0"><dt className="text-slate-500">Latitude</dt><dd className="font-mono font-semibold text-navy">{position ? position.lat.toFixed(5) : 'Unavailable'}</dd></div>
            <div className="flex items-center justify-between gap-3 py-2.5"><dt className="text-slate-500">Longitude</dt><dd className="font-mono font-semibold text-navy">{position ? position.lng.toFixed(5) : 'Unavailable'}</dd></div>
            <div className="flex items-center justify-between gap-3 py-2.5 last:pb-0"><dt className="text-slate-500">Vehicle</dt><dd className="font-semibold text-navy">{feedBus?.plate || feedBus?.id || 'Unavailable'}</dd></div>
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
              : 'Vehicle location is not available until you start a trip. No fallback position is shown.'}
          </p>
        </Card>

        {!settings.map.showRoute && (
          <Notice tone="blue" icon={Info}>The road route line is hidden. Turn it on in Settings → Map display. Stop markers remain visible.</Notice>
        )}
      </div>
    </div>
  )
}
