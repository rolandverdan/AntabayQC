import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, Tooltip, useMap } from 'react-leaflet'

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

export function FitBounds({ points, fitKey }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [30, 30] })
    else if (points.length === 1) map.setView([points[0].lat, points[0].lng], 15)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, map])
  return null
}

// Road-snapped geometry from the public OSRM demo server (cached per stop list). Falls back to the straight
// stop-to-stop line when offline or when the request fails.
const roadCache = new Map()
export function useRoadPath(points, enabled) {
  const key = enabled && points.length > 1 ? points.map((p) => `${(+p.lng).toFixed(5)},${(+p.lat).toFixed(5)}`).join(';') : ''
  const [result, setResult] = useState(() => key && roadCache.has(key)
    ? { key, path: roadCache.get(key), status: 'ready' }
    : { key: '', path: null, status: 'idle' })
  useEffect(() => {
    if (!key) { setResult({ key, path: null, status: 'idle' }); return undefined }
    if (roadCache.has(key)) {
      setResult({ key, path: roadCache.get(key), status: 'ready' })
      return undefined
    }
    setResult({ key, path: null, status: 'loading' })
    const ctrl = new AbortController()
    fetch(`https://router.project-osrm.org/route/v1/driving/${key}?overview=full&geometries=geojson`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('route failed'))))
      .then((j) => {
        const coords = j?.routes?.[0]?.geometry?.coordinates
        if (!coords?.length) throw new Error('No road geometry returned')
        const line = coords.map(([lng, lat]) => [lat, lng])
        roadCache.set(key, line)
        setResult({ key, path: line, status: 'ready' })
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ key, path: null, status: 'error' })
      })
    return () => ctrl.abort()
  }, [key])
  return result.key === key ? result : { key, path: null, status: key ? 'loading' : 'idle' }
}

export function RoadLine({ route, snap }) {
  const { path: road } = useRoadPath(route.points, snap)
  const pos = road || route.points.map((p) => [p.lat, p.lng])
  return (
    <>
      <Polyline positions={pos} pathOptions={{ color: '#fff', weight: 8, opacity: 0.9 }} interactive={false} />
      <Polyline positions={pos} pathOptions={{ color: route.color, weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}>
        <Tooltip sticky>{route.id} · {route.name}</Tooltip>
      </Polyline>
    </>
  )
}

const numberIcon = (n, tone) =>
  L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:9999px;background:${tone};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:#fff;font:700 12px Inter,sans-serif;">${n}</div>`,
  })

const STOP_STATE = {
  passed: { bg: '#64748b', fg: '#fff', border: '#fff', size: 24, label: 'passed' },
  next: { bg: '#16a34a', fg: '#fff', border: '#fff', size: 30, label: 'next stop' },
  upcoming: { bg: '#fff', fg: '#193B70', border: '#193B70', size: 24, label: 'upcoming' },
}
const stopIcon = (n, state) => {
  const t = STOP_STATE[state] || STOP_STATE.upcoming
  const ring = state === 'next' ? 'box-shadow:0 0 0 4px rgba(22,163,74,.3),0 2px 6px rgba(0,0,0,.4);' : 'box-shadow:0 1px 4px rgba(0,0,0,.35);'
  return L.divIcon({
    className: '',
    iconSize: [t.size, t.size],
    iconAnchor: [t.size / 2, t.size / 2],
    html: `<div style="width:${t.size}px;height:${t.size}px;border-radius:9999px;background:${t.bg};color:${t.fg};border:2px solid ${t.border};${ring}display:flex;align-items:center;justify-content:center;font:700 ${state === 'next' ? 13 : 11}px Inter,sans-serif;">${n}</div>`,
  })
}

const busIcon = (img, color, dim, pulse, selected) => {
  const w = selected ? 48 : 42
  const h = Math.round(w * 2.01)
  const ring = selected ? 'drop-shadow(0 0 0 #193B70) drop-shadow(0 0 3px #193B70)' : 'drop-shadow(0 2px 3px rgba(0,0,0,.45))'
  const dot = dim
    ? ''
    : `<span class="${pulse ? 'pulse-red' : ''}" style="position:absolute;right:-5px;top:-5px;width:15px;height:15px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);"></span>`
  return L.divIcon({
    className: '',
    iconSize: [w, h],
    iconAnchor: [w / 2, h / 2],
    html: `<div class="bus-marker-rotator" style="position:relative;width:${w}px;height:${h}px;transform-origin:50% 50%;"><img src="${img}" alt="" draggable="false" style="width:100%;height:100%;display:block;filter:${ring}${dim ? ' saturate(.55) opacity(.75)' : ''};"/>${dot}</div>`,
  })
}

function BusMarker({ bus, onBusClick }) {
  const markerRef = useRef(null)
  const icon = useMemo(
    () => busIcon(bus.img, bus.color, bus.dim, bus.pulse, bus.selected),
    [bus.color, bus.dim, bus.img, bus.pulse, bus.selected],
  )

  useEffect(() => {
    const rotator = markerRef.current?.getElement()?.querySelector('.bus-marker-rotator')
    if (rotator) rotator.style.transform = `rotate(${Math.round(bus.heading || 0)}deg)`
  }, [bus.heading, icon])

  return (
    <Marker
      ref={markerRef}
      position={[bus.lat, bus.lng]}
      icon={icon}
      zIndexOffset={bus.selected ? 1000 : 500}
      eventHandlers={{ click: () => onBusClick && onBusClick(bus.id) }}
    >
      <Tooltip direction="top" offset={[0, -40]}>{bus.tooltip || bus.id}</Tooltip>
      {bus.info && (
        <Popup>
          <div className="min-w-52 space-y-2 text-sm">
            <div>
              <p className="font-bold text-navy">{bus.id}</p>
              <p className="text-xs text-slate-500">{bus.info.route}</p>
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <dt className="text-slate-500">Model</dt><dd className="font-medium text-slate-800">{bus.info.model}</dd>
              <dt className="text-slate-500">Plate</dt><dd className="font-medium text-slate-800">{bus.info.plate}</dd>
              <dt className="text-slate-500">Speed</dt><dd className="font-medium text-slate-800">{bus.info.speed}</dd>
              <dt className="text-slate-500">Passengers</dt><dd className="font-medium text-slate-800">{bus.info.passengers}</dd>
              <dt className="text-slate-500">Seats available</dt><dd className="font-medium text-slate-800">{bus.info.seatsAvailable}</dd>
              <dt className="text-slate-500">Next stop</dt><dd className="font-medium text-slate-800">{bus.info.nextStop}</dd>
              <dt className="text-slate-500">Last update</dt><dd className="font-medium text-slate-800">{bus.info.updatedAt}</dd>
            </dl>
          </div>
        </Popup>
      )}
    </Marker>
  )
}

/**
 * stops:  [{ id, name, lat, lng }]
 * routes: [{ id, name, color, points: [{lat,lng}] }]
 * stopMarks: { [stopId]: { n, state: 'passed' | 'next' | 'upcoming' } } numbers stops along one route
 * buses:  [{ id, lat, lng, img, heading, color (status dot), pulse, dim, selected, tooltip }]
 */
export default function MapView({ stops = [], routes = [], buses = [], onBusClick, className = 'h-80', scrollWheelZoom = true, terminalLabels = false, focus = null, numbered = false, stopMarks = null, roadSnap = false, emptyMessage = '', fitKey: fitKeyOverride = null }) {
  const fitPoints = stops.length ? stops : routes.flatMap((r) => r.points)
  const fitKey = fitKeyOverride ?? fitPoints.map((p) => `${p.lat},${p.lng}`).join('|')

  const showEmpty = !!emptyMessage && stops.length < 2
  return (
    <div className={`relative isolate w-full ${className}`}>
    <MapContainer center={QC_CENTER} zoom={12} scrollWheelZoom={scrollWheelZoom} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={fitPoints} fitKey={fitKey} />
      <FocusOn focus={focus} />
      {routes.map((r) => (
        <Fragment key={r.id}><RoadLine route={r} snap={roadSnap} /></Fragment>
      ))}
      {!numbered && routes.map((r) =>
        r.points.length > 1 ? [r.points[0], r.points[r.points.length - 1]].map((p, i) => (
          <CircleMarker key={`${r.id}-end-${i}`} center={[p.lat, p.lng]} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: r.color, fillOpacity: 1 }} interactive={false}>
            {terminalLabels && <Tooltip permanent direction="top" offset={[0, -8]}>{i === 0 ? 'Start' : 'End'}</Tooltip>}
          </CircleMarker>
        )) : null,
      )}
      {numbered && stops.map((s, i) => (
        <Marker key={`${s.id}-${i}`} position={[s.lat, s.lng]} icon={numberIcon(i + 1, i === 0 ? '#16a34a' : i === stops.length - 1 && stops.length > 1 ? '#dc2626' : '#244A9B')} zIndexOffset={400}>
          <Tooltip direction="top" offset={[0, -14]}>{i + 1}. {s.name}</Tooltip>
        </Marker>
      ))}
      {!numbered && stopMarks && stops.filter((s) => stopMarks[s.id]).map((s) => {
        const m = stopMarks[s.id]
        return (
          <Marker key={`mark-${s.id}`} position={[s.lat, s.lng]} icon={stopIcon(m.n, m.state)} zIndexOffset={m.state === 'next' ? 450 : 300}>
            <Tooltip direction="top" offset={[0, -14]}>{m.n}. {s.name}{m.state === 'next' ? ' · next stop' : m.state === 'passed' ? ' · passed' : ''}</Tooltip>
          </Marker>
        )
      })}
      {!numbered && stops.filter((s) => !stopMarks?.[s.id]).map((s) => (
        <CircleMarker key={s.id} center={[s.lat, s.lng]} radius={5} pathOptions={{ color: '#193B70', weight: 2, fillColor: '#fff', fillOpacity: 1 }}>
          <Tooltip>{s.name} ({s.id})</Tooltip>
        </CircleMarker>
      ))}
      {buses.map((b) => (
        <BusMarker
          key={b.id}
          bus={b}
          onBusClick={onBusClick}
        />
      ))}
    </MapContainer>
    {showEmpty && (
      <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/80 p-6 text-center backdrop-blur-[1px]">
        <p className="max-w-56 text-sm font-semibold text-slate-600">{emptyMessage}</p>
      </div>
    )}
    </div>
  )
}
