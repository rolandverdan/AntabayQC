import { useEffect, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Tooltip, useMap } from 'react-leaflet'
import { Plus, Minus, LocateFixed, Maximize2, Navigation } from 'lucide-react'
import { ROUTE, ROUTE_STOPS } from '../data/mock.js'

const vehicleIcon = L.divIcon({
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  html: `<div style="width:40px;height:40px;border-radius:9999px;background:#244A9B;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;color:#fff;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
  </div>`,
})

function Follow({ position, follow }) {
  const map = useMap()
  useEffect(() => {
    if (follow) map.panTo([position.lat, position.lng], { animate: true })
  }, [position.lat, position.lng, follow, map])
  return null
}

function CtrlBtn({ label, onClick, active = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active || undefined}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-lg border shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-brand/40 ${
        active ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white text-navy hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}

/** Leaflet map with a simulated vehicle marker. Tiles need internet; the vehicle data is mock data. */
export default function ConductorMap({ position, nextStopId, prefs }) {
  const [map, setMap] = useState(null)
  const [follow, setFollow] = useState(prefs.followVehicle)
  const points = ROUTE_STOPS.map((s) => [s.lat, s.lng])

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
    <div className="relative h-full min-h-[300px] overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        ref={setMap}
        center={[position.lat, position.lng]}
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

        <Marker position={[position.lat, position.lng]} icon={vehicleIcon} zIndexOffset={1000}>
          <Tooltip direction="top" offset={[0, -20]}>Your vehicle (simulated)</Tooltip>
        </Marker>
      </MapContainer>

      <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2">
        <CtrlBtn label="Zoom in" onClick={() => map?.zoomIn()}><Plus size={18} /></CtrlBtn>
        <CtrlBtn label="Zoom out" onClick={() => map?.zoomOut()}><Minus size={18} /></CtrlBtn>
        <CtrlBtn label="Center on my vehicle" onClick={recenter}><LocateFixed size={18} /></CtrlBtn>
        <CtrlBtn label="Show the whole route" onClick={fitRoute}><Maximize2 size={18} /></CtrlBtn>
        <CtrlBtn label={follow ? 'Stop following vehicle' : 'Follow vehicle'} onClick={() => setFollow((f) => !f)} active={follow}>
          <Navigation size={18} />
        </CtrlBtn>
      </div>

      <div className="absolute bottom-3 left-3 z-[500] rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
        Simulated position · not live GPS
      </div>
    </div>
  )
}
