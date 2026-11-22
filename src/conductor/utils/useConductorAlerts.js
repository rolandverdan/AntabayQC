import { useCallback, useEffect, useRef } from 'react'
import { capacityStatus } from './capacity.js'

// Turns changes on this phone into entries on the Alerts page: the bus becoming full or
// overboard, a trip starting or ending, GPS lost during a trip, and the live feed being refused.
// Camera connection alerts are raised by the Camera page itself.

const REPEAT_GAP_MS = 60000 // the same alert is not repeated within a minute (e.g. count flapping 59↔60)

export default function useConductorAlerts({ addAlert, passengerCount, capacity, trip, gpsStatus, gpsMessage, feed }) {
  const lastRaised = useRef({})
  const raise = useCallback((key, alert) => {
    const now = Date.now()
    if (now - (lastRaised.current[key] || 0) < REPEAT_GAP_MS) return
    lastRaised.current[key] = now
    addAlert(alert)
  }, [addAlert])

  // Bus load: alert once when it reaches Full, and again if it goes Overboard.
  const load = capacityStatus(passengerCount, capacity)
  const previousLoad = useRef(load.key)
  useEffect(() => {
    const before = previousLoad.current
    previousLoad.current = load.key
    if (load.key === before) return
    if (load.key === 'full' && before !== 'over') {
      raise('load-full', { category: 'passengerAlerts', tone: 'warning', title: 'Bus is full', body: `${passengerCount} of ${load.limit} passengers. Do not let more people on.` })
    }
    if (load.key === 'over') {
      raise('load-over', { category: 'passengerAlerts', tone: 'danger', title: 'Overboard', body: `${passengerCount} passengers, ${load.over} over the limit of ${load.limit}.` })
    }
  }, [load.key, load.limit, load.over, passengerCount, raise])

  // Trip started / ended.
  const previousTrip = useRef(trip.active)
  useEffect(() => {
    const before = previousTrip.current
    previousTrip.current = trip.active
    if (before === trip.active) return
    if (trip.active) {
      raise('trip-start', { category: 'trip', tone: 'info', title: 'Trip started', body: 'Your location and passenger count are now shared with admin.' })
    } else if (trip.summary) {
      const { distanceKm, boarded, alighted } = trip.summary
      raise('trip-end', { category: 'trip', tone: 'info', title: 'Trip ended', body: `${distanceKm.toFixed(1)} km · ${boarded} boarded · ${alighted} alighted. Sharing stopped.` })
    }
  }, [trip.active, trip.summary, raise])

  // GPS lost while a trip is running.
  useEffect(() => {
    if (trip.active && gpsStatus === 'error') {
      raise('gps-lost', { category: 'gps', tone: 'warning', title: 'Phone GPS lost', body: gpsMessage || 'Your location is not being shared. Turn GPS back on from the Trip card.' })
    }
  }, [trip.active, gpsStatus, gpsMessage, raise])

  // Live feed refused by the server.
  const sendError = feed.send.status === 'error' ? feed.send.error : ''
  useEffect(() => {
    if (sendError) {
      raise('feed-error', { category: 'system', tone: 'warning', title: 'Live updates not reaching admin', body: sendError })
    }
  }, [sendError, raise])
}
