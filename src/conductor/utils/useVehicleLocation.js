import { useCallback, useEffect, useRef, useState } from 'react'
import { computeBusLive, haversineKm } from '../../admin/utils/geo.js'
import { VEHICLE, ROUTE, STOPS_BY_ID } from '../data/mock.js'

function routeProgressForPosition(position) {
  const points = ROUTE.stopIds.map((id) => STOPS_BY_ID[id]).filter(Boolean)
  const lengths = points.slice(1).map((point, index) => haversineKm(points[index], point))
  const totalLength = lengths.reduce((total, length) => total + length, 0)
  if (!totalLength) return null

  let distanceBeforeSegment = 0
  let closestDistanceSquared = Infinity
  let closestProgress = null

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index]
    const end = points[index + 1]
    const longitudeScale = Math.cos(((start.lat + end.lat) / 2) * Math.PI / 180)
    const startX = start.lng * longitudeScale
    const startY = start.lat
    const deltaX = (end.lng - start.lng) * longitudeScale
    const deltaY = end.lat - start.lat
    const positionX = position.lng * longitudeScale
    const positionY = position.lat
    const segmentLengthSquared = deltaX * deltaX + deltaY * deltaY
    const fraction = segmentLengthSquared
      ? Math.min(1, Math.max(0, ((positionX - startX) * deltaX + (positionY - startY) * deltaY) / segmentLengthSquared))
      : 0
    const distanceX = positionX - (startX + fraction * deltaX)
    const distanceY = positionY - (startY + fraction * deltaY)
    const distanceSquared = distanceX * distanceX + distanceY * distanceY

    if (distanceSquared < closestDistanceSquared) {
      closestDistanceSquared = distanceSquared
      closestProgress = (distanceBeforeSegment + lengths[index] * fraction) / totalLength
    }

    distanceBeforeSegment += lengths[index]
  }

  return closestProgress === null ? null : Math.min(0.9999, Math.max(0, closestProgress))
}

export default function useVehicleLocation() {
  const [position, setPosition] = useState(null)
  const [gpsAccuracy, setGpsAccuracy] = useState(null)
  const [gpsUpdatedAt, setGpsUpdatedAt] = useState(null)
  const [gpsSpeed, setGpsSpeed] = useState(null)
  const [gpsStatus, setGpsStatus] = useState('idle')
  const [gpsMessage, setGpsMessage] = useState('')
  const watchId = useRef(null)
  const watchGeneration = useRef(0)

  const stopPhoneGps = useCallback(() => {
    watchGeneration.current += 1
    if (watchId.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current)
    }
    watchId.current = null
    setPosition(null)
    setGpsAccuracy(null)
    setGpsUpdatedAt(null)
    setGpsSpeed(null)
    setGpsStatus('idle')
    setGpsMessage('')
  }, [])

  const usePhoneGps = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('error')
      setGpsMessage('This browser does not support phone location.')
      return
    }

    watchGeneration.current += 1
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    watchId.current = null
    setPosition(null)
    setGpsAccuracy(null)
    setGpsUpdatedAt(null)
    setGpsSpeed(null)
    setGpsStatus('requesting')
    setGpsMessage('')
    const generation = watchGeneration.current

    watchId.current = navigator.geolocation.watchPosition(
      ({ coords, timestamp }) => {
        if (watchGeneration.current !== generation) return
        setPosition({ lat: coords.latitude, lng: coords.longitude })
        setGpsAccuracy(coords.accuracy)
        setGpsUpdatedAt(timestamp)
        setGpsSpeed(coords.speed === null ? null : Math.max(0, coords.speed * 3.6))
        setGpsStatus('active')
      },
      (error) => {
        if (watchGeneration.current !== generation) return
        if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
        setPosition(null)
        setGpsAccuracy(null)
        setGpsUpdatedAt(null)
        setGpsSpeed(null)
        setGpsStatus('error')
        setGpsMessage(
          error.code === error.PERMISSION_DENIED
            ? 'Location access was denied. Allow it in your browser settings to use phone GPS.'
            : error.code === error.POSITION_UNAVAILABLE
              ? 'Phone location is unavailable. Check the device location settings and try again.'
              : 'Phone location timed out. Check the connection and try again.',
        )
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 },
    )
  }, [])

  useEffect(() => () => {
    watchGeneration.current += 1
    if (watchId.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current)
    }
  }, [])

  const progress = position ? routeProgressForPosition(position) : null
  const live = progress === null ? null : computeBusLive(VEHICLE, ROUTE, STOPS_BY_ID, progress)
  const etaMin = live && gpsSpeed > 0
    ? Math.max(1, Math.round((haversineKm(position, live.nextStop) / gpsSpeed) * 60))
    : null
  const location = position
    ? { ...position, label: `Phone GPS · approaching ${live?.nextStop.name || 'the route'}` }
    : null

  return {
    position,
    progress,
    nextStop: live?.nextStop || null,
    speed: gpsSpeed,
    etaMin,
    gpsStatus,
    gpsMessage,
    gpsAccuracy,
    gpsUpdatedAt,
    usePhoneGps,
    stopPhoneGps,
    location,
  }
}
