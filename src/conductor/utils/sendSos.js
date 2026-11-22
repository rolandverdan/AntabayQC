import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase/firebase.js'

// Conductor emergency types → the incident types and severities used by Admin → Emergency Logs.
export const SOS_TO_INCIDENT = {
  medical: { type: 'Medical Emergency', severity: 'Critical' },
  accident: { type: 'Accident', severity: 'Critical' },
  breakdown: { type: 'Mechanical Breakdown', severity: 'High' },
  disturbance: { type: 'Harassment', severity: 'High' },
  security: { type: 'Security Threat', severity: 'Critical' },
  fire: { type: 'Fire', severity: 'Critical' },
  other: { type: 'Other', severity: 'High' },
}

const ACK_WAIT_MS = 8000 // how long to wait for the server before telling the conductor it is queued

// Saves the SOS in `emergencies`, where Admin → Emergency Logs shows it.
// Resolves to 'sent' (server confirmed), 'queued' (no signal yet; Firestore sends it when the
// phone is back online) or throws (e.g. the rules refused it).
export async function sendSos({ typeId, description, location, bus, route, reporterName }) {
  const incident = SOS_TO_INCIDENT[typeId] || SOS_TO_INCIDENT.other
  const ref = doc(collection(db, 'emergencies'))
  const now = new Date().toISOString()
  const place = location
    ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)} (phone GPS)`
    : 'Unavailable (phone GPS off)'
  const record = {
    id: ref.id,
    type: incident.type,
    severity: incident.severity,
    status: 'New',
    busId: bus?.id || '',
    routeId: route?.id || bus?.routeId || '',
    location: place,
    description: description || 'No details added.',
    reportedBy: reporterName || 'Conductor',
    reporterUid: auth.currentUser?.uid || '',
    source: 'conductor-sos',
    datetime: now,
    history: [{ status: 'New', at: now, by: reporterName || 'Conductor' }],
    createdAt: serverTimestamp(),
  }
  if (location) {
    record.lat = location.lat
    record.lng = location.lng
  }

  const write = setDoc(ref, record)
  const outcome = await Promise.race([
    write.then(() => 'sent'),
    new Promise((resolve) => window.setTimeout(() => resolve('queued'), ACK_WAIT_MS)),
  ])
  // A queued write can still be refused later; report that in the console.
  if (outcome === 'queued') write.catch((error) => console.error('Queued SOS was refused:', error))
  return { id: ref.id, outcome, incident, place }
}
