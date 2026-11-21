import { useEffect, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Polyline, Circle, CircleMarker, Marker, Tooltip, useMap } from 'react-leaflet'
import { Plus, Minus, LocateFixed, Maximize2, Navigation } from 'lucide-react'
import { busImage, bearingDeg, routeColor } from '../../admin/utils/geo.js'
import { useRoadPath } from '../../admin/components/MapView.jsx'

// The conductor's own vehicle: the route's 3D bus image, turned toward the next stop.
const vehicleIcon = (heading, routeId) =>
  L.divIcon({
    className: '',
    iconSize: [42, 84],
    iconAnchor: [21, 42],
    html: `<div style="width:42px;height:84px;transform:rotate(${Math.round(heading)}deg);transform-origin:50% 50%;"><img src="${busImage(routeId)}" alt="" draggable="false" style="width:100%;height:100%;display:block;filter:drop-shadow(0 3px 4px rgba(0,0,0,.5));"/></div>`,
  })

const stopIcon = (number, isNext) => {
  const fill = isNext ? '#E8B800' : '#193B70'
  const text = isNext ? '#193B70' : '#fff'
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:9999px;background:${fill};border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;color:${text};font:700 12px Inter,sans-serif;">${number}</div>`,
  })
}

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
export default function ConductorMap({ position, route, routeStops = [], nextStopId, prefs, gpsStatus, gpsAccuracy }) {
  const nextStop = routeStops.find((s) => s.id === nextStopId)
  const heading = position && nextStop ? bearingDeg(position, nextStop) : 0
  const [map, setMap] = useState(null)
  const [follow, setFollow] = useState(prefs.followVehicle)
  const mapStops = routeStops.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
  const stopPoints = mapStops.map((s) => [s.lat, s.lng])
  const { path: roadPath, status: roadStatus } = useRoadPath(mapStops, !!route && mapStops.length > 1)
  const initialCenter = mapStops[0]
  const color = routeColor(route?.id, route)

  // Keep the follow toggle in sync when the Settings preference changes.
  useEffect(() => setFollow(prefs.followVehicle), [prefs.followVehicle])

  useEffect(() => {
    const routePoints = routeStops
      .filter((stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng))
      .map((stop) => [stop.lat, stop.lng])
    if (map && routePoints.length > 1 && !position) map.fitBounds(routePoints, { padding: [40, 40] })
  }, [map, route?.id, routeStops, position])

  const recenter = () => {
    map?.setView([position.lat, position.lng], prefs.defaultZoom, { animate: true })
  }
  const fitRoute = () => {
    if (stopPoints.length < 2) return
    setFollow(false)
    map?.fitBounds(stopPoints, { padding: [40, 40] })
  }

  return (
    <div className="relative isolate h-full min-h-[300px] overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        ref={setMap}
        center={position ? [position.lat, position.lng] : initialCenter ? [initialCenter.lat, initialCenter.lng] : [14.676, 121.043]}
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

        {prefs.showRoute && roadPath?.length > 1 && (
          <>
            <Polyline positions={roadPath} pathOptions={{ color: '#fff', weight: 9, opacity: 0.9 }} interactive={false} />
            <Polyline positions={roadPath} pathOptions={{ color, weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}>
              <Tooltip sticky>{route?.id} · {route?.name}</Tooltip>
            </Polyline>
          </>
        )}

        {prefs.showRoute && mapStops.length > 1 && [mapStops[0], mapStops[mapStops.length - 1]].map((s, i) => (
          <CircleMarker key={`end-${i}`} center={[s.lat, s.lng]} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: color, fillOpacity: 1 }} interactive={false} />
        ))}

        {mapStops.map((s, index) => {
          const isNext = s.id === nextStopId
          return (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              icon={stopIcon(index + 1, isNext)}
              zIndexOffset={isNext ? 600 : 400}
            >
              <Tooltip direction="top" offset={[0, -12]}>{index + 1}. {s.name}{isNext ? ' · Next stop' : ''}</Tooltip>
            </Marker>
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
          <Marker position={[position.lat, position.lng]} icon={vehicleIcon(heading, route?.id)} zIndexOffset={1000}>
            <Tooltip direction="top" offset={[0, -42]}>Your vehicle · phone GPS</Tooltip>
          </Marker>
        )}
      </MapContainer>

      {prefs.showRoute && route && mapStops.length > 1 && !roadPath && (
        <div role="status" className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
          {roadStatus === 'error' ? 'Could not load the road route. Check your internet connection.' : 'Loading road route…'}
        </div>
      )}

      <div className="pointer-events-none absolute left-3 top-3 z-[500] flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
        <span className={`h-2 w-2 rounded-full ${position ? 'bg-green-600' : gpsStatus === 'requesting' ? 'animate-pulse bg-amber-500' : 'bg-slate-400'}`} aria-hidden="true" />
        {position ? `Phone GPS · ±${Math.round(gpsAccuracy)} m` : gpsStatus === 'requesting' ? 'Waiting for phone GPS' : 'No GPS location'}
      </div>

      <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2 [@media(max-height:480px)]:grid [@media(max-height:480px)]:grid-cols-2">
        <CtrlBtn label="Zoom in" onClick={() => map?.zoomIn()}><Plus size={18} /></CtrlBtn>
        <CtrlBtn label="Zoom out" onClick={() => map?.zoomOut()}><Minus size={18} /></CtrlBtn>
        <CtrlBtn label="Center on my location" onClick={recenter} disabled={!position}><LocateFixed size={18} /></CtrlBtn>
        <CtrlBtn label="Show the whole route" onClick={fitRoute} disabled={stopPoints.length < 2}><Maximize2 size={18} /></CtrlBtn>
        <CtrlBtn label={follow ? 'Stop following vehicle' : 'Follow vehicle'} onClick={() => setFollow((f) => !f)} active={follow}>
          <Navigation size={18} />
        </CtrlBtn>
      </div>
    </div>
  )
}
