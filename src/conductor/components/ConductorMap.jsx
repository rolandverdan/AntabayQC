import { useEffect, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Polyline, Circle, CircleMarker, Marker, Tooltip, useMap } from 'react-leaflet'
import { Plus, Minus, LocateFixed, Maximize2, Navigation } from 'lucide-react'
import { ROUTE, ROUTE_STOPS } from '../data/mock.js'
import { busImage, bearingDeg } from '../../admin/utils/geo.js'

// The conductor's own vehicle: the route's 3D bus image, turned toward the next stop.
const vehicleIcon = (heading) =>
  L.divIcon({
    className: '',
    iconSize: [42, 84],
    iconAnchor: [21, 42],
    html: `<div style="width:42px;height:84px;transform:rotate(${Math.round(heading)}deg);transform-origin:50% 50%;"><img src="${busImage(ROUTE.id)}" alt="" draggable="false" style="width:100%;height:100%;display:block;filter:drop-shadow(0 3px 4px rgba(0,0,0,.5));"/></div>`,
  })

function Follow({ position, follow }) {
  const map = useMap()
  const latitude = position?.lat
  const longitude = position?.lng
  useEffect(() => {
    if (follow && latitude !== undefined && longitude !== undefined) map.panTo([latitude, longitude], { animate: true })
  }, [latitude, longitude, follow, map])
  return null
}

function CtrlBtn({ label, onClick, active = false, disabled = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active || undefined}
      title={label}
      className={`flex h-11 w-11 items-center justify-center rounded-lg border shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-50 ${
        active ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white text-navy hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}

/** Leaflet map with a vehicle marker only while phone GPS provides a current position. */
export default function ConductorMap({ position, nextStopId, prefs, gpsStatus, gpsAccuracy }) {
  const nextStop = ROUTE_STOPS.find((s) => s.id === nextStopId)
  const heading = position && nextStop ? bearingDeg(position, nextStop) : 0
  const [map, setMap] = useState(null)
  const [follow, setFollow] = useState(prefs.followVehicle)
  const points = ROUTE_STOPS.map((s) => [s.lat, s.lng])
  const initialCenter = ROUTE_STOPS[0]

  // Keep the follow toggle in sync when the Settings preference changes.
  useEffect(() => setFollow(prefs.followVehicle), [prefs.followVehicle])

  const recenter = () => {
    map?.setView([position.lat, position.lng], prefs.defaultZoom, { animate: true })
  }
  const fitRoute = () => {
    setFollow(false)
    map?.fitBounds(points, { padding: [40, 40] })
  }

  return (
    <div className="relative isolate h-full min-h-[300px] overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        ref={setMap}
        center={[initialCenter.lat, initialCenter.lng]}
        zoom={prefs.defaultZoom}
        zoomControl={false}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Follow position={position} follow={follow} />

        {prefs.showRoute && (
          <>
            <Polyline positions={points} pathOptions={{ color: '#fff', weight: 9, opacity: 0.9 }} interactive={false} />
            <Polyline positions={points} pathOptions={{ color: ROUTE.color, weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}>
              <Tooltip sticky>{ROUTE.id} · {ROUTE.name}</Tooltip>
            </Polyline>
          </>
        )}

        {prefs.showRoute && [ROUTE_STOPS[0], ROUTE_STOPS[ROUTE_STOPS.length - 1]].map((s, i) => (
          <CircleMarker key={`end-${i}`} center={[s.lat, s.lng]} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: ROUTE.color, fillOpacity: 1 }} interactive={false} />
        ))}

        {prefs.showStops && ROUTE_STOPS.map((s) => {
          const isNext = s.id === nextStopId
          return (
            <CircleMarker
              key={s.id}
              center={[s.lat, s.lng]}
              radius={isNext ? 8 : 5}
              pathOptions={{ color: '#193B70', weight: 2, fillColor: isNext ? '#E8B800' : '#fff', fillOpacity: 1 }}
            >
              <Tooltip>{isNext ? 'Next stop: ' : ''}{s.name}</Tooltip>
            </CircleMarker>
          )
        })}

        {position && gpsAccuracy > 0 && (
          <Circle
            center={[position.lat, position.lng]}
            radius={gpsAccuracy}
            pathOptions={{ color: '#15803d', fillColor: '#22c55e', fillOpacity: 0.12, weight: 1 }}
            interactive={false}
          />
        )}

        {position && (
          <Marker position={[position.lat, position.lng]} icon={vehicleIcon(heading)} zIndexOffset={1000}>
            <Tooltip direction="top" offset={[0, -42]}>Your vehicle · phone GPS</Tooltip>
          </Marker>
        )}
      </MapContainer>

      <div className="pointer-events-none absolute left-3 top-3 z-[500] flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
        <span className={`h-2 w-2 rounded-full ${position ? 'bg-green-600' : gpsStatus === 'requesting' ? 'animate-pulse bg-amber-500' : 'bg-slate-400'}`} aria-hidden="true" />
        {position ? `Phone GPS · ±${Math.round(gpsAccuracy)} m` : gpsStatus === 'requesting' ? 'Waiting for phone GPS' : 'No GPS location'}
      </div>

      <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2 [@media(max-height:480px)]:grid [@media(max-height:480px)]:grid-cols-2">
        <CtrlBtn label="Zoom in" onClick={() => map?.zoomIn()}><Plus size={18} /></CtrlBtn>
        <CtrlBtn label="Zoom out" onClick={() => map?.zoomOut()}><Minus size={18} /></CtrlBtn>
        <CtrlBtn label="Center on my location" onClick={recenter} disabled={!position}><LocateFixed size={18} /></CtrlBtn>
        <CtrlBtn label="Show the whole route" onClick={fitRoute}><Maximize2 size={18} /></CtrlBtn>
        <CtrlBtn label={follow ? 'Stop following vehicle' : 'Follow vehicle'} onClick={() => setFollow((f) => !f)} active={follow}>
          <Navigation size={18} />
        </CtrlBtn>
      </div>
    </div>
  )
}
