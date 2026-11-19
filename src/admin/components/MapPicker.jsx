import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { FitBounds, QC_CENTER, RoadLine } from './MapView.jsx'

function ClickHandler({ onChange }) {
  useMapEvents({
    click(e) {
      onChange({ lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) })
    },
  })
  return null
}

function KeepInView({ value }) {
  const map = useMap()
  useEffect(() => {
    if (value && !map.getBounds().contains([value.lat, value.lng])) map.panTo([value.lat, value.lng])
  }, [value, map])
  return null
}

/** value: { lat, lng } | null. Click the map to pick coordinates. */
export default function MapPicker({ value, onChange, routes = [], className = 'h-64' }) {
  const valid = value && Number.isFinite(value.lat) && Number.isFinite(value.lng)
  const routePoints = routes.flatMap((route) => route.points)
  const fitKey = routePoints.map((point) => `${point.lat},${point.lng}`).join('|')
  return (
    <MapContainer center={valid ? [value.lat, value.lng] : QC_CENTER} zoom={valid ? 15 : 12} className={`w-full ${className}`}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={routePoints} fitKey={fitKey} />
      <ClickHandler onChange={onChange} />
      {routes.map((route) => <RoadLine key={route.id} route={route} snap />)}
      {routes.flatMap((route) => route.points.map((point, index) => (
        <CircleMarker key={`${route.id}-${point.id || index}`} center={[point.lat, point.lng]} radius={6} pathOptions={{ color: '#fff', weight: 2, fillColor: route.color, fillOpacity: 1 }}>
          <Tooltip>{index + 1}. {point.name}</Tooltip>
        </CircleMarker>
      )))}
      {valid && (
        <>
          <KeepInView value={value} />
          <CircleMarker center={[value.lat, value.lng]} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#244A9B', fillOpacity: 1 }} />
        </>
      )}
    </MapContainer>
  )
}
