import { occupancyLevel, OCCUPANCY } from './occupancy.js'

// QC Bus poster colours: Route 1 red, 2 magenta, 3 yellow, 4 purple, 5 orange, 6 green, 7 blue, 8 light blue.
export const ROUTE_COLORS = ['#244A9B', '#E4264B', '#E6168E', '#E8B800', '#7A2E8E', '#F28C1E', '#1FA34A', '#1566B8', '#2BA8E8']
export const routeColor = (routeId = '', route) => {
  if (route?.color) return route.color
  const n = parseInt(/(\d+)$/.exec(routeId)?.[1] || '0', 10)
  return n >= 1 ? ROUTE_COLORS[((n - 1) % 8) + 1] : ROUTE_COLORS[0]
}

export function haversineKm(a, b) {
  const R = 6371
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

export function pathLengthKm(pts) {
  let total = 0
  for (let i = 0; i < pts.length - 1; i++) total += haversineKm(pts[i], pts[i + 1])
  return total
}

/** Position at fraction t (0..1) along straight segments between stops (schematic, not road-snapped). */
export function pointAlongPath(pts, t) {
  const segs = []
  let total = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const d = haversineKm(pts[i], pts[i + 1])
    segs.push(d)
    total += d
  }
  let target = Math.min(Math.max(t, 0), 0.9999) * total
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i] || i === segs.length - 1) {
      const f = segs[i] ? target / segs[i] : 0
      return {
        lat: pts[i].lat + (pts[i + 1].lat - pts[i].lat) * f,
        lng: pts[i].lng + (pts[i + 1].lng - pts[i].lng) * f,
        nextIndex: i + 1,
        distToNextKm: segs[i] - target,
      }
    }
    target -= segs[i]
  }
  return null
}

/** Position / speed / ETA for a bus on its assigned route. Returns null if it has no usable route. */
export function computeBusLive(bus, route, stopsById, progress = bus.progress || 0) {
  if (!route) return null
  const pts = route.stopIds.map((id) => stopsById[id]).filter(Boolean)
  if (pts.length < 2) return null
  const pos = pointAlongPath(pts, progress)
  if (!pos) return null
  const speed = bus.status === 'Active' ? bus.speed || 20 : 0
  const etaMin = speed > 0 ? Math.max(1, Math.round((pos.distToNextKm / speed) * 60)) : null
  return {
    lat: pos.lat,
    lng: pos.lng,
    speed,
    nextStop: pts[pos.nextIndex],
    etaMin,
    routeLengthKm: pathLengthKm(pts),
  }
}

/** Marker colour + label for the map, shared by dashboard preview and live map. */
export function busMarkerStyle(bus) {
  if (bus.status === 'Emergency') return { color: '#dc2626', label: '!', pulse: true }
  if (bus.status !== 'Active') return { color: '#64748b', label: bus.id.replace(/^BUS-?/i, '') }
  return {
    color: OCCUPANCY[occupancyLevel(bus.passengers, bus.capacity)].color,
    label: bus.id.replace(/^BUS-?/i, ''),
  }
}
