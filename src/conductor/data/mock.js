// FRONTEND DEMO DATA ONLY. Nothing here comes from a real GPS unit, CCTV system,
// dispatcher, or account database. Vehicle / route data is reused from the admin mock data.
import { seedData } from '../../admin/data/mockData.js'

const db = seedData()

export const DEMO_USERNAMES = ['lourdes.garcia', 'lourdes.garcia@antabayqc.demo', 'conductor']
export const DEMO_PASSWORD = 'Conductor123!'

const account = db.accounts.find((a) => a.id === 'ACC-007')
export const VEHICLE = db.buses.find((b) => b.conductorId === 'ACC-007')
export const ROUTE = db.routes.find((r) => r.id === VEHICLE.routeId)
export const STOPS_BY_ID = Object.fromEntries(db.stops.map((s) => [s.id, s]))
export const ROUTE_STOPS = ROUTE.stopIds.map((id) => STOPS_BY_ID[id]).filter(Boolean)

export const initialProfile = {
  fullName: account.fullName,
  conductorId: account.employeeId,
  assignedVehicle: `${VEHICLE.id} · ${VEHICLE.plate}`,
  assignedRoute: `${ROUTE.id} · ${ROUTE.name}`,
  contact: account.contact,
  email: 'lourdes.garcia@antabayqc.demo',
}

export const initialSettings = {
  notifications: { delays: true, passengerAlerts: true, adminMessages: true },
  sound: { enabled: true, volume: 60, tone: 'chime' },
  map: { showStops: true, showRoute: true, followVehicle: true, defaultZoom: 14 },
  sos: { holdToConfirm: true, holdSeconds: 2 },
}

export const EMERGENCY_TYPES = [
  { id: 'medical', label: 'Medical Emergency', hint: 'A passenger or crew member needs medical help.', icon: 'HeartPulse' },
  { id: 'accident', label: 'Accident or Collision', hint: 'The vehicle was involved in a crash.', icon: 'CarFront' },
  { id: 'breakdown', label: 'Vehicle Breakdown', hint: 'The vehicle cannot continue the trip.', icon: 'Wrench' },
  { id: 'disturbance', label: 'Passenger Disturbance', hint: 'A passenger is disruptive or aggressive.', icon: 'Users' },
  { id: 'security', label: 'Security Threat', hint: 'Weapon, theft, or another threat on board.', icon: 'ShieldAlert' },
  { id: 'fire', label: 'Fire or Smoke', hint: 'Fire or smoke in or around the vehicle.', icon: 'Flame' },
  { id: 'other', label: 'Other Emergency', hint: 'Anything else that needs urgent attention.', icon: 'CircleAlert' },
]

export const CAMERAS = [
  { id: 'CAM-1', name: 'Front door', location: 'Boarding area', startsOnline: true, reachable: true },
  { id: 'CAM-2', name: 'Aisle (interior)', location: 'Mid-cabin', startsOnline: true, reachable: true },
  { id: 'CAM-3', name: 'Rear door', location: 'Exit area', startsOnline: false, reachable: true },
  { id: 'CAM-4', name: 'Driver cabin', location: 'Front, facing driver', startsOnline: false, reachable: false },
]

export const NOTIFICATIONS = [
  { id: 'n1', category: 'delays', title: 'Slow traffic ahead', body: 'Kalayaan Ave is moving slowly. Expect about 4 minutes of delay.', time: '5 min ago' },
  { id: 'n2', category: 'passengerAlerts', title: 'High load at next stop', body: 'Many passengers are waiting at Barangay Silangan Hall.', time: '12 min ago' },
  { id: 'n3', category: 'adminMessages', title: 'Message from operations', body: 'Sample message: please log your end-of-route headcount.', time: '30 min ago' },
]
