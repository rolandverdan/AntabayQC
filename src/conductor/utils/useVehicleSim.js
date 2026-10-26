import { useEffect, useState } from 'react'
import { computeBusLive } from '../../admin/utils/geo.js'
import { VEHICLE, ROUTE, STOPS_BY_ID } from '../data/mock.js'

// Simulated vehicle position: advances along the mock route every few seconds.
// This is NOT live GPS.
const STEP = 0.006
const INTERVAL_MS = 3000

export default function useVehicleSim() {
  const [progress, setProgress] = useState(VEHICLE.progress)
  const [running, setRunning] = useState(true)

  useEffect(() => {
    if (!running) return undefined
    const id = setInterval(() => setProgress((p) => (p + STEP >= 0.98 ? 0.02 : p + STEP)), INTERVAL_MS)
    return () => clearInterval(id)
  }, [running])

  const live = computeBusLive(VEHICLE, ROUTE, STOPS_BY_ID, progress)
  const speed = running ? live.speed : 0
  const etaMin = running && speed > 0 ? Math.max(1, Math.round(((live.etaMin || 1) * live.speed) / speed)) : null

  return {
    progress, running, setRunning,
    position: { lat: live.lat, lng: live.lng },
    speed, etaMin,
    nextStop: live.nextStop,
    routeLengthKm: live.routeLengthKm,
    // Human-readable mock location used by the SOS report
    location: { lat: live.lat, lng: live.lng, label: `Approaching ${live.nextStop.name}` },
  }
}
