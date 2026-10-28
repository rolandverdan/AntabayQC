import { fmtDateTime } from './format.js'

const dt = (iso) => (iso ? fmtDateTime(iso) : '')

export const LOG_COLUMNS = [
  { header: 'Log ID', value: (l) => l.id },
  { header: 'Date and Time', value: (l) => dt(l.timestamp) },
  { header: 'User', value: (l) => l.user },
  { header: 'Action', value: (l) => l.action },
  { header: 'Module', value: (l) => l.module },
  { header: 'Severity', value: (l) => l.severity },
  { header: 'Description', value: (l) => l.description },
]

export const exportCategory = (key) => EXPORT_CATEGORIES.find((c) => c.key === key)

const nameOf = (accountsById, id) => accountsById[id]?.fullName || ''

/**
 * Export categories. `rows(data)` reads the current frontend state (useAdminData());
 * nothing is invented or fetched from a backend.
 */
export const EXPORT_CATEGORIES = [
  { key: 'logs', label: 'System Logs', file: 'system-logs', rows: (d) => d.logs, columns: () => LOG_COLUMNS },
  {
    key: 'reports', label: 'Report Logs', file: 'report-logs', rows: (d) => d.reports,
    columns: () => [
      { header: 'Report ID', value: (r) => r.id }, { header: 'Type', value: (r) => r.type },
      { header: 'Date and Time', value: (r) => dt(r.datetime) }, { header: 'Bus', value: (r) => r.busId },
      { header: 'Route', value: (r) => r.routeId }, { header: 'Reported By', value: (r) => r.reportedBy },
      { header: 'Priority', value: (r) => r.priority }, { header: 'Status', value: (r) => r.status },
      { header: 'Description', value: (r) => r.description },
    ],
  },
  {
    key: 'emergencies', label: 'Emergency Logs', file: 'emergency-logs', rows: (d) => d.emergencies,
    columns: () => [
      { header: 'Emergency ID', value: (e) => e.id }, { header: 'Incident Type', value: (e) => e.type },
      { header: 'Date and Time', value: (e) => dt(e.datetime) }, { header: 'Bus', value: (e) => e.busId },
      { header: 'Route', value: (e) => e.routeId }, { header: 'Reported By', value: (e) => e.reportedBy },
      { header: 'Location', value: (e) => e.location }, { header: 'Severity', value: (e) => e.severity },
      { header: 'Status', value: (e) => e.status }, { header: 'Description', value: (e) => e.description },
    ],
  },
  {
    key: 'buses', label: 'Bus Records', file: 'bus-records', rows: (d) => d.buses,
    columns: (d) => [
      { header: 'Bus ID', value: (b) => b.id }, { header: 'Plate Number', value: (b) => b.plate },
      { header: 'Model', value: (b) => b.model }, { header: 'Capacity', value: (b) => b.capacity },
      { header: 'Route', value: (b) => b.routeId }, { header: 'Driver', value: (b) => nameOf(d.accountsById, b.driverId) },
      { header: 'Conductor', value: (b) => nameOf(d.accountsById, b.conductorId) },
      { header: 'Passengers', value: (b) => b.passengers }, { header: 'Status', value: (b) => b.status },
    ],
  },
  {
    key: 'accounts', label: 'Driver and Conductor Accounts', file: 'driver-conductor-accounts', rows: (d) => d.accounts,
    columns: (d) => [
      { header: 'Account ID', value: (a) => a.id }, { header: 'Role', value: (a) => a.type },
      { header: 'Full Name', value: (a) => a.fullName }, { header: 'Employee ID', value: (a) => a.employeeId },
      { header: 'Username', value: (a) => a.username }, { header: 'Contact Number', value: (a) => a.contact },
      {
        header: 'Assigned Bus',
        value: (a) => d.buses.find((b) => (a.type === 'Driver' ? b.driverId : b.conductorId) === a.id)?.id || '',
      },
      { header: 'Status', value: (a) => a.status }, { header: 'Created', value: (a) => dt(a.createdAt) },
    ],
  },
  {
    key: 'stops', label: 'Bus Stops', file: 'bus-stops', rows: (d) => d.stops,
    columns: () => [
      { header: 'Stop ID', value: (s) => s.id }, { header: 'Stop Name', value: (s) => s.name },
      { header: 'Address', value: (s) => s.address }, { header: 'Latitude', value: (s) => s.lat },
      { header: 'Longitude', value: (s) => s.lng }, { header: 'Status', value: (s) => s.status },
    ],
  },
  {
    key: 'routes', label: 'Routes', file: 'routes', rows: (d) => d.routes,
    columns: (d) => [
      { header: 'Route ID', value: (r) => r.id }, { header: 'Route Name', value: (r) => r.name },
      { header: 'Status', value: (r) => r.status }, { header: 'Number of Stops', value: (r) => r.stopIds.length },
      { header: 'Stops (in order)', value: (r) => r.stopIds.map((id) => d.stopsById[id]?.name || id).join(' > ') },
    ],
  },
]
