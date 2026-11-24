import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { collection, deleteDoc, doc, getDocs, limit, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { db } from '../../firebase/firebase.js'
import { bearingDeg, haversineKm } from '../../admin/utils/geo.js'
import { routeProgressForPosition } from './useVehicleLocation.js'

// Live feed from the conductor's phone to the admin side (Firestore busLocations/{busId}).
// The phone's mobile data carries it, even while its Wi-Fi is connected to the door camera.
// Firestore rules only accept writes from the conductor assigned to that bus.

const HEARTBEAT_MS = 15000 // send at least this often while there is something to report
const MIN_GAP_MS = 5000 // never send more often than this (keeps Firestore writes and data use low)
const CLEAR_WAIT_MS = 5000 // how long End trip waits for the server to confirm the live record is gone
const HEADING_MIN_MOVE_KM = 0.01 // only update the heading after moving 10 m, so GPS jitter does not spin the bus icon

function nextStopFor(position, route, stopsById) {
  if (!position || !route) return null
  const points = (route.stopIds || []).map((id) => stopsById[id]).filter(Boolean)
  const progress = routeProgressForPosition(position, points)
  if (progress === null) return null
  // Walk the route to find the first stop past the current progress.
  const lengths = points.slice(1).map((point, index) => haversineKm(points[index], point))
  const total = lengths.reduce((sum, length) => sum + length, 0)
  let travelled = 0
  for (let index = 0; index < lengths.length; index += 1) {
    travelled += lengths[index]
    if (travelled / total > progress) return points[index + 1]
  }
  return points[points.length - 1]
}

// `enabled`: only send while the conductor has a trip running (Start trip on the Map page).
export default function useBusFeed({ uid, position, speed, gpsAccuracy, passengers, entries, exits, enabled = true }) {
  // Results are tagged with the uid / route they belong to, so stale ones are ignored without
  // resetting state inside the effects.
  const [found, setFound] = useState({ uid: '', status: 'loading', accountId: '', bus: null, error: '' })
  const [routeState, setRouteState] = useState({ routeId: '', route: null })
  const [stopsById, setStopsById] = useState({})
  const [send, setSend] = useState({ status: 'idle', lastSentAt: null, error: '' })
  const headingRef = useRef({ from: null, heading: null })

  // 1. Find this conductor's staff account, then the bus assigned to it (kept live, so admin
  //    reassignments apply without logging out).
  useEffect(() => {
    if (!uid) return undefined
    let cancelled = false
    let unsubscribeBus = () => {}
    const setAssignment = (next) => setFound({ uid, ...next })
    getDocs(query(collection(db, 'accounts'), where('uid', '==', uid), limit(1)))
      .then((snapshot) => {
        if (cancelled) return
        if (snapshot.empty) {
          setAssignment({ status: 'no-account', accountId: '', bus: null, error: '' })
          return
        }
        const accountId = snapshot.docs[0].id
        const employeeId = snapshot.docs[0].data().employeeId || ''
        unsubscribeBus = onSnapshot(
          query(collection(db, 'buses'), where('conductorId', '==', accountId), limit(1)),
          (buses) => {
            const bus = buses.empty ? null : { ...buses.docs[0].data(), id: buses.docs[0].id }
            setAssignment({ status: bus ? 'ready' : 'no-bus', accountId, employeeId, bus, error: '' })
          },
          (error) => setAssignment({ status: 'error', accountId, employeeId, bus: null, error: error.message }),
        )
      })
      .catch((error) => {
        if (!cancelled) setAssignment({ status: 'error', accountId: '', bus: null, error: error.message })
      })
    return () => {
      cancelled = true
      unsubscribeBus()
    }
  }, [uid])
  const assignment = !uid
    ? { status: 'signed-out', accountId: '', bus: null, error: '' }
    : found.uid === uid ? found : { status: 'loading', accountId: '', bus: null, error: '' }

  // 2. Load the bus's real route and stops, used to work out the next stop.
  const routeId = assignment.bus?.routeId || ''
  useEffect(() => {
    if (!routeId) return undefined
    let cancelled = false
    const unsubscribeRoute = onSnapshot(doc(db, 'routes', routeId), (snapshot) => {
      setRouteState({ routeId, route: snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null })
    }, () => setRouteState({ routeId, route: null }))
    getDocs(collection(db, 'stops'))
      .then((snapshot) => {
        if (!cancelled) setStopsById(Object.fromEntries(snapshot.docs.map((item) => [item.id, { ...item.data(), id: item.id }])))
      })
      .catch((error) => console.error('Could not load bus stops for the live feed:', error))
    return () => {
      cancelled = true
      unsubscribeRoute()
    }
  }, [routeId])

  const route = routeId && routeState.routeId === routeId ? routeState.route : null
  const routeStops = useMemo(
    () => route ? (route.stopIds || []).map((id) => stopsById[id]).filter(Boolean) : [],
    [route, stopsById],
  )
  const nextStop = useMemo(() => nextStopFor(position, route, stopsById), [position, route, stopsById])
  const busId = assignment.bus?.id || ''

  // Latest values to send, read by the timer below without restarting it on every GPS update.
  const latest = useRef(null)
  const lat = position?.lat
  const lng = position?.lng
  useEffect(() => {
    if (!busId) {
      latest.current = null
      return
    }
    const record = { busId, source: 'conductor-phone', passengers, entries, exits }
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const here = { lat, lng }
      const tracker = headingRef.current
      if (!tracker.from) tracker.from = here
      else if (haversineKm(tracker.from, here) >= HEADING_MIN_MOVE_KM) {
        tracker.heading = Math.round(bearingDeg(tracker.from, here)) % 360
        tracker.from = here
      }
      record.lat = lat
      record.lng = lng
      // Firestore rules reject speed outside 0–200 km/h; a GPS glitch must not block the whole update.
      if (Number.isFinite(speed)) record.speed = Math.min(200, Math.max(0, Math.round(speed)))
      if (Number.isFinite(gpsAccuracy)) record.accuracy = Math.min(100000, Math.max(0, Math.round(gpsAccuracy)))
      if (tracker.heading !== null) record.heading = tracker.heading
      if (nextStop) {
        record.nextStopId = nextStop.id
        record.nextStopName = nextStop.name || ''
      }
    }
    latest.current = record
  }, [busId, uid, lat, lng, speed, gpsAccuracy, nextStop, passengers, entries, exits])

  // 3. Send: right away when the passenger count changes, otherwise on a heartbeat.
  const lastSent = useRef({ at: 0, passengers: null })
  const inFlight = useRef(false)
  const pendingWrite = useRef(null) // the upload in progress, so End trip can wait for it
  const stopped = useRef(true) // set by clearLive so no upload slips out after End trip
  useEffect(() => {
    if (!busId || !enabled) return undefined
    stopped.current = false
    lastSent.current = { at: 0, passengers: null } // send right away when a trip starts
    const trySend = async () => {
      const record = latest.current
      if (!record || inFlight.current || stopped.current) return
      const now = Date.now()
      const countChanged = record.passengers !== lastSent.current.passengers
      const due = now - lastSent.current.at >= HEARTBEAT_MS
      if (now - lastSent.current.at < MIN_GAP_MS || (!countChanged && !due)) return
      inFlight.current = true
      lastSent.current = { at: now, passengers: record.passengers }
      setSend((current) => ({ ...current, status: 'sending' }))
      try {
        pendingWrite.current = setDoc(doc(db, 'busLocations', record.busId), { ...record, updatedAt: serverTimestamp() })
        await pendingWrite.current
        setSend({ status: 'sent', lastSentAt: Date.now(), error: '' })
      } catch (error) {
        console.error('Live feed upload failed:', error)
        setSend((current) => ({
          ...current,
          status: 'error',
          error: error.code === 'permission-denied'
            ? 'The server refused the update. Ask an admin to check that this account is assigned to this bus and that the latest Firestore rules are published.'
            : error.message,
        }))
      } finally {
        inFlight.current = false
        pendingWrite.current = null
      }
    }
    const timer = window.setInterval(trySend, 1000)
    return () => window.clearInterval(timer)
  }, [busId, enabled])

  // 4. End trip: stop uploading and delete busLocations/{busId}, so the bus disappears from the
  //    admin and commuter maps right away instead of showing its last position.
  //    Resolves 'cleared', 'queued' (no signal yet; Firestore deletes it when back online) or 'none'.
  const clearLive = useCallback(async () => {
    stopped.current = true
    if (!busId) return 'none'
    try {
      await pendingWrite.current // let a last upload land first so it cannot re-create the record
    } catch {
      /* already reported by the uploader */
    }
    const removal = deleteDoc(doc(db, 'busLocations', busId))
    const outcome = await Promise.race([
      removal.then(() => 'cleared'),
      new Promise((resolve) => window.setTimeout(() => resolve('queued'), CLEAR_WAIT_MS)),
    ])
    if (outcome === 'queued') removal.catch((error) => console.error('Queued live record removal was refused:', error))
    setSend({ status: 'idle', lastSentAt: null, error: '' })
    return outcome
  }, [busId])

  // A record left behind (phone died or the app closed mid-trip) is removed the next time this
  // conductor opens the app without a trip running.
  const enabledRef = useRef(enabled)
  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])
  useEffect(() => {
    if (!busId || enabledRef.current) return
    deleteDoc(doc(db, 'busLocations', busId)).catch((error) => console.error('Could not remove the old live record:', error))
  }, [busId])

  return { assignment, route, routeStops, nextStop, send, clearLive, sharing: Boolean(busId && enabled), hasGps: Number.isFinite(lat) && Number.isFinite(lng) }
}
