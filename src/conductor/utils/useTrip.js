import { useCallback, useEffect, useRef, useState } from 'react'
import { haversineKm } from '../../admin/utils/geo.js'

// A conductor trip: Start trip turns on phone GPS and the live feed to admin; End trip turns
// them off and shows a summary. Saved in this browser so a page refresh does not lose the trip.
// The saved trip belongs to the account that started it: another account signing in on the same
// phone starts with no trip, and only the conductor presses Start trip.
// The door cameras are separate and keep their own Start/Stop buttons.

const TRIP_KEY = 'antabayqc_conductor_trip_v1'
const MIN_STEP_KM = 0.015 // ignore GPS jitter under 15 m when adding up distance
const MAX_ACCURACY_M = 50 // only trust fixes at least this accurate for distance

const IDLE = { uid: '', status: 'idle', startedAt: null, startEntries: 0, startExits: 0, distanceKm: 0, last: null, summary: null }

function readTrip(uid) {
  try {
    const stored = JSON.parse(localStorage.getItem(TRIP_KEY) || 'null')
    if (uid && stored && stored.uid === uid && (stored.status === 'active' || stored.status === 'idle')) return { ...IDLE, ...stored }
  } catch {
    console.error('Could not read the saved trip from this browser.')
  }
  return { ...IDLE, uid }
}

export default function useTrip({ uid, position, gpsAccuracy, gpsStatus, startGps, stopGps, entries, exits }) {
  const [saved, setTrip] = useState(() => readTrip(uid))
  // A trip saved by a different account never shows (or runs) for this one.
  const trip = saved.uid === uid ? saved : { ...IDLE, uid }
  const active = Boolean(uid) && trip.status === 'active'

  useEffect(() => {
    if (!uid || saved.uid !== uid) return
    try {
      localStorage.setItem(TRIP_KEY, JSON.stringify(saved))
    } catch (error) {
      console.error('Could not save the trip in this browser:', error)
    }
  }, [saved, uid])

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
      if (current.status !== 'active' || current.uid !== uid) return current
      const here = { lat, lng }
      if (!current.last) return { ...current, last: here }
      const step = haversineKm(current.last, here)
      if (step < MIN_STEP_KM) return current
      return { ...current, distanceKm: current.distanceKm + step, last: here }
    })
  }, [active, uid, lat, lng, gpsAccuracy])

  // `baseline`: entry/exit totals at the start of the trip (0 when the counts were just reset).
  const startTrip = useCallback((baseline = { entries, exits }) => {
    if (!uid) return
    setTrip({ ...IDLE, uid, status: 'active', startedAt: Date.now(), startEntries: baseline.entries, startExits: baseline.exits })
    startGps()
  }, [uid, entries, exits, startGps])

  const endTrip = useCallback(() => {
    setTrip((current) => {
      if (current.status !== 'active' || current.uid !== uid) return current
      return {
        ...IDLE,
        uid,
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
  }, [uid, entries, exits, stopGps])

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
