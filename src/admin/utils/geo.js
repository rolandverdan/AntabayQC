import { occupancyLevel, OCCUPANCY } from './occupancy.js'

// Colours match the 3D bus images in /images/buses (bus-1 … bus-8): Route 1 red, 2 magenta, 3 yellow, 4 purple, 5 orange, 6 green, 7 blue, 8 light blue.
export const ROUTE_COLORS = ['#244A9B', '#E3262C', '#EC0D8F', '#F9C80F', '#792D8B', '#F69627', '#06A553', '#4D73B5', '#3BB4FB']
export const routeColor = (routeId = '', route) => {
  if (route?.color) return route.color
  const n = parseInt(/(\d+)$/.exec(routeId)?.[1] || '0', 10)
  return n >= 1 ? ROUTE_COLORS[((n - 1) % 8) + 1] : ROUTE_COLORS[0]
}

/** Bus artwork for a route (bus-1…bus-8, top-down, nose pointing up). */
export const busImage = (routeId = '') => {
  const n = parseInt(/(\d+)$/.exec(routeId)?.[1] || '0', 10)
  return `/images/buses/bus-${n >= 1 ? ((n - 1) % 8) + 1 : 1}.png`
}

/** Compass bearing in degrees (0 = north, clockwise) from a to b. */
export function bearingDeg(a, b) {
  const rad = (d) => (d * Math.PI) / 180
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat))
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng))
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
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
        heading: bearingDeg(pts[i], pts[i + 1]),
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
    heading: pos.heading,
    nextIndex: pos.nextIndex,
    etaMin,
    routeLengthKm: pathLengthKm(pts),
  }
}

/**
 * Numbered stop markers for one route, relative to a bus: stops the bus has already passed,
 * the stop it is heading to, and the ones still ahead. Returns { [stopId]: { n, state } }.
 * Without `live` every stop is just "upcoming" (plain numbering).
 */
export function routeStopMarks(route, live) {
  if (!route) return {}
  const marks = {}
  route.stopIds.forEach((id, i) => {
    let state = 'upcoming'
    if (live) state = i < live.nextIndex ? 'passed' : i === live.nextIndex ? 'next' : 'upcoming'
    marks[id] = { n: i + 1, state, total: route.stopIds.length }
  })
  return marks
}

/** Marker data for the map, shared by dashboard preview, live map and commuter tracking. `color` is the occupancy / status dot. */
export function busMarkerStyle(bus, live) {
  const base = { img: busImage(bus.routeId), heading: live?.heading || 0, label: bus.id.replace(/^BUS-?/i, '') }
  if (bus.status === 'Emergency') return { ...base, color: '#dc2626', label: '!', pulse: true }
  if (bus.status !== 'Active') return { ...base, color: '#64748b', dim: true }
  return { ...base, color: OCCUPANCY[occupancyLevel(bus.passengers, bus.capacity)].color }
}
