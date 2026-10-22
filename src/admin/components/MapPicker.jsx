import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet'
import { QC_CENTER } from './MapView.jsx'

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
export default function MapPicker({ value, onChange, className = 'h-64' }) {
  const valid = value && Number.isFinite(value.lat) && Number.isFinite(value.lng)
  return (
    <MapContainer center={valid ? [value.lat, value.lng] : QC_CENTER} zoom={valid ? 15 : 12} className={`w-full ${className}`}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onChange={onChange} />
      {valid && (
        <>
          <KeepInView value={value} />
          <CircleMarker center={[value.lat, value.lng]} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#244A9B', fillOpacity: 1 }} />
        </>
      )}
    </MapContainer>
  )
}
