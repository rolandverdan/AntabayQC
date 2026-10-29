import { Fragment, useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Tooltip, useMap } from 'react-leaflet'

export const QC_CENTER = [14.65, 121.05]

// Smoothly centres the map on a point (e.g. the bus a commuter just picked).
function FocusOn({ focus }) {
  const map = useMap()
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], Math.max(map.getZoom(), 14), { duration: 0.6 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.key, map])
  return null
}

function FitBounds({ points, fitKey }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [30, 30] })
    else if (points.length === 1) map.setView([points[0].lat, points[0].lng], 15)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, map])
  return null
}

const safe = (s) => String(s).replace(/[^\w!-]/g, '').slice(0, 4)

const busIcon = (b) =>
  L.divIcon({
    className: '',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    html: `<div class="${b.pulse ? 'pulse-red' : ''}" style="width:38px;height:38px;border-radius:9999px;background:${b.color};border:3px solid ${b.selected ? '#193B70' : '#fff'};box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:#fff;font:700 11px Inter,sans-serif;">${safe(b.label)}</div>`,
  })

/**
 * stops:  [{ id, name, lat, lng }]
 * routes: [{ id, name, color, points: [{lat,lng}] }]
 * buses:  [{ id, lat, lng, color, label, pulse, selected, tooltip }]
 */
export default function MapView({ stops = [], routes = [], buses = [], onBusClick, className = 'h-80', scrollWheelZoom = true, terminalLabels = false, focus = null }) {
  const fitPoints = stops.length ? stops : routes.flatMap((r) => r.points)
  const fitKey = fitPoints.map((p) => `${p.lat},${p.lng}`).join('|')

  return (
    <MapContainer center={QC_CENTER} zoom={12} scrollWheelZoom={scrollWheelZoom} className={`w-full ${className}`}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={fitPoints} fitKey={fitKey} />
      <FocusOn focus={focus} />
      {routes.map((r) => {
        const pos = r.points.map((p) => [p.lat, p.lng])
        return (
          <Fragment key={r.id}>
            <Polyline positions={pos} pathOptions={{ color: '#fff', weight: 8, opacity: 0.9 }} interactive={false} />
            <Polyline positions={pos} pathOptions={{ color: r.color, weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}>
              <Tooltip sticky>{r.id} · {r.name}</Tooltip>
            </Polyline>
          </Fragment>
        )
      })}
      {routes.map((r) =>
        r.points.length > 1 ? [r.points[0], r.points[r.points.length - 1]].map((p, i) => (
          <CircleMarker key={`${r.id}-end-${i}`} center={[p.lat, p.lng]} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: r.color, fillOpacity: 1 }} interactive={false}>
            {terminalLabels && <Tooltip permanent direction="top" offset={[0, -8]}>{i === 0 ? 'Start' : 'End'}</Tooltip>}
          </CircleMarker>
        )) : null,
      )}
      {stops.map((s) => (
        <CircleMarker key={s.id} center={[s.lat, s.lng]} radius={5} pathOptions={{ color: '#193B70', weight: 2, fillColor: '#fff', fillOpacity: 1 }}>
          <Tooltip>{s.name} ({s.id})</Tooltip>
        </CircleMarker>
      ))}
      {buses.map((b) => (
        <Marker
          key={b.id}
          position={[b.lat, b.lng]}
          icon={busIcon(b)}
          zIndexOffset={b.selected ? 1000 : 500}
          eventHandlers={{ click: () => onBusClick && onBusClick(b.id) }}
        >
          <Tooltip direction="top" offset={[0, -18]}>{b.tooltip || b.id}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  )
}
