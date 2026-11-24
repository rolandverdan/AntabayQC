import { useCallback, useEffect, useRef, useState } from 'react'
import { haversineKm } from '../../admin/utils/geo.js'

// A conductor trip: Start trip turns on phone GPS and the live feed to admin; End trip turns
// them off and shows a summary. Saved in this browser so a page refresh does not lose the trip.
// The door cameras are separate and keep their own Start/Stop buttons.

const TRIP_KEY = 'antabayqc_conductor_trip_v1'
const MIN_STEP_KM = 0.015 // ignore GPS jitter under 15 m when adding up distance
const MAX_ACCURACY_M = 50 // only trust fixes at least this accurate for distance

const IDLE = { status: 'idle', startedAt: null, startEntries: 0, startExits: 0, distanceKm: 0, last: null, summary: null }

function readTrip() {
  try {
    const stored = JSON.parse(localStorage.getItem(TRIP_KEY) || 'null')
    if (stored && (stored.status === 'active' || stored.status === 'idle')) return { ...IDLE, ...stored }
  } catch {
    console.error('Could not read the saved trip from this browser.')
  }
  return IDLE
}

export default function useTrip({ position, gpsAccuracy, gpsStatus, startGps, stopGps, entries, exits }) {
  const [trip, setTrip] = useState(readTrip)
  const active = trip.status === 'active'

  useEffect(() => {
    try {
      localStorage.setItem(TRIP_KEY, JSON.stringify(trip))
    } catch (error) {
      console.error('Could not save the trip in this browser:', error)
    }
  }, [trip])

  // A trip that was running before a refresh needs its GPS back.
  const resumed = useRef(false)
  useEffect(() => {
    if (resumed.current) return
    resumed.current = true
    if (active && gpsStatus === 'idle') startGps()
  }, [active, gpsStatus, startGps])

  // Add up distance travelled from good GPS fixes.
  const lat = position?.lat
  const lng = position?.lng
  useEffect(() => {
    if (!active || !Number.isFinite(lat) || !Number.isFinite(lng)) return
    if (Number.isFinite(gpsAccuracy) && gpsAccuracy > MAX_ACCURACY_M) return
    setTrip((current) => {
      if (current.status !== 'active') return current
      const here = { lat, lng }
      if (!current.last) return { ...current, last: here }
      const step = haversineKm(current.last, here)
      if (step < MIN_STEP_KM) return current
      return { ...current, distanceKm: current.distanceKm + step, last: here }
    })
  }, [active, lat, lng, gpsAccuracy])

  // `baseline`: entry/exit totals at the start of the trip (0 when the counts were just reset).
  const startTrip = useCallback((baseline = { entries, exits }) => {
    setTrip({ ...IDLE, status: 'active', startedAt: Date.now(), startEntries: baseline.entries, startExits: baseline.exits })
    startGps()
  }, [entries, exits, startGps])

  const endTrip = useCallback(() => {
    setTrip((current) => {
      if (current.status !== 'active') return current
      return {
        ...IDLE,
        summary: {
          startedAt: current.startedAt,
          endedAt: Date.now(),
          distanceKm: current.distanceKm,
          boarded: Math.max(0, entries - current.startEntries),
          alighted: Math.max(0, exits - current.startExits),
        },
      }
    })
    stopGps()
  }, [entries, exits, stopGps])

  const dismissSummary = useCallback(() => setTrip((current) => ({ ...current, summary: null })), [])

  return {
    active,
    startedAt: trip.startedAt,
    distanceKm: trip.distanceKm,
    boarded: active ? Math.max(0, entries - trip.startEntries) : 0,
    alighted: active ? Math.max(0, exits - trip.startExits) : 0,
    summary: trip.summary,
    startTrip,
    endTrip,
    dismissSummary,
  }
}
