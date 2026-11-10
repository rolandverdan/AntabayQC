import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bus, CircleCheck, ClipboardCheck, Users, MapPin, Route, Siren, FileText, Plus, UserPlus } from 'lucide-react'
import { useAdminData } from '../context/AdminDataContext.jsx'
import Card, { StatCard, PageHeader } from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import Badge from '../components/Badge.jsx'
import MapView from '../components/MapView.jsx'
import RecentActivity from '../components/RecentActivity.jsx'
import PassengerTrend from '../components/PassengerTrend.jsx'
import { OCCUPANCY, occupancyLevel } from '../utils/occupancy.js'
import { BUS_STATUSES } from '../data/constants.js'
import { busImage, routeColor } from '../utils/geo.js'

export default function Dashboard() {
  const { buses, accounts, stops, routes, logs, reports, emergencies, settings, stopsById, busLocations, busLocationsById } = useAdminData()
  const navigate = useNavigate()

  const activeBuses = buses.filter((b) => b.status === 'Active').length
  const drivers = accounts.filter((a) => a.type === 'Driver').length
  const conductors = accounts.length - drivers
  const activeEmergencies = emergencies.filter((e) => e.status !== 'Resolved').length
  const pendingReports = reports.filter((r) => r.status === 'Pending').length
  const resolvedReports = reports.filter((r) => r.status === 'Resolved').length

  const statusCounts = BUS_STATUSES.map((s) => ({ s, n: buses.filter((b) => b.status === s).length }))
  const passengerLocations = busLocations.filter((location) => typeof location.passengers === 'number' && Number.isFinite(location.passengers))
  const occ = { green: 0, yellow: 0, red: 0 }
  passengerLocations.forEach((location) => {
    const bus = buses.find((item) => item.id === (location.busId || location.id))
    if (bus) occ[occupancyLevel(location.passengers, bus.capacity)] += 1
  })

  const mapBuses = useMemo(
    () =>
      buses.flatMap((bus) => {
        const location = busLocationsById[bus.id]
        if (!location || !Number.isFinite(Number(location.lat)) || !Number.isFinite(Number(location.lng))) return []
        return [{
          id: bus.id,
          lat: Number(location.lat),
          lng: Number(location.lng),
          img: busImage(bus.routeId),
          heading: Number(location.heading) || 0,
          color: bus.status === 'Emergency' ? '#dc2626' : bus.status === 'Active' ? '#2563eb' : '#64748b',
          dim: bus.status !== 'Active' && bus.status !== 'Emergency',
          pulse: bus.status === 'Emergency',
          label: bus.id.replace(/^BUS-?/i, ''),
          tooltip: `${bus.id} · ${bus.status}`,
        }]
      }),
    [buses, busLocationsById],
  )
  const mapRoutes = routes
    .filter((r) => r.status === 'Active')
    .map((r) => ({ id: r.id, name: r.name, color: routeColor(r.id, r), points: r.stopIds.map((id) => stopsById[id]).filter(Boolean) }))

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of the ANTABAY QC system."
        actions={
          <div className="flex flex-wrap gap-2 sm:justify-end" role="group" aria-label="Quick actions">
            <Button icon={UserPlus} variant="secondary" onClick={() => navigate('/admin/accounts?new=driver')}>Register Driver</Button>
            <Button icon={Route} variant="secondary" onClick={() => navigate('/admin/routes?new=1')}>Add Route</Button>
            <Button icon={Plus} onClick={() => navigate('/admin/buses?new=1')}>Create Bus</Button>
            <Button icon={Siren} variant="danger" onClick={() => navigate('/admin/emergency-logs')}>View Emergencies</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard reserveSub icon={Bus} label="Total buses" value={buses.length} to="/admin/buses" />
        <StatCard reserveSub icon={CircleCheck} label="Active buses" value={activeBuses} tone="green" sub={`${buses.length - activeBuses} not in service`} to="/admin/buses" />
        <StatCard reserveSub icon={Users} label="Drivers & conductors" value={accounts.length} tone="teal" sub={`${drivers} drivers · ${conductors} conductors`} to="/admin/accounts" />
        <StatCard reserveSub icon={MapPin} label="Total bus stops" value={stops.length} tone="teal" to="/admin/bus-stops" />
        <StatCard reserveSub icon={Route} label="Total routes" value={routes.length} to="/admin/routes" sub={`${routes.filter((r) => r.status === 'Active').length} active`} />
        <StatCard reserveSub icon={Siren} label="Active emergencies" value={activeEmergencies} tone="red" to="/admin/emergency-logs" />
        <StatCard reserveSub icon={FileText} label="Pending reports" value={pendingReports} tone="amber" to="/admin/report-logs" />
        <StatCard reserveSub icon={ClipboardCheck} label="Resolved reports" value={resolvedReports} tone="green" to="/admin/report-logs" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Bus operational status">
          <div className="space-y-4">
            {statusCounts.map(({ s, n }) => (
              <div key={s}>
                <div className="mb-2 flex items-center justify-between text-xs"><Badge>{s}</Badge><span className="font-semibold text-navy">{n}</span></div>
                <div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand" style={{ width: `${buses.length ? (n / buses.length) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Passenger occupancy">
          <div className="space-y-3.5">
            {Object.entries(OCCUPANCY).map(([k, o]) => (
              <div key={k} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                <span className="flex items-center gap-2 text-sm text-slate-700"><span className="h-3 w-3 rounded-full" style={{ background: o.color }} />{o.label}</span>
                <span className="text-lg font-bold text-navy">{occ[k]}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">{passengerLocations.length ? `Counts received from ${passengerLocations.length} bus(es).` : 'No passenger-counter feed is connected.'}</p>
        </Card>

        {settings.showMapPreview ? (
          <Card title="Map preview" action={<Link to="/admin/map" className="text-xs font-semibold text-brand hover:underline">Open map</Link>} bodyClass="p-2">
            <MapView stops={stops.filter((s) => s.status === 'Active')} routes={mapRoutes} buses={mapBuses} className="h-56" scrollWheelZoom={false} />
            <p className="px-2 pb-1 pt-2 text-[11px] text-slate-500">{mapBuses.length ? 'Showing reported GPS positions only.' : 'No buses are reporting GPS positions.'}</p>
          </Card>
        ) : (
          <Card title="Map preview"><p className="text-sm text-slate-500">Hidden in Settings → Dashboard preferences.</p></Card>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className={settings.showRecentActivity ? 'xl:col-span-2' : 'xl:col-span-3'}><PassengerTrend locations={busLocations} /></div>
        {settings.showRecentActivity && <RecentActivity emergencies={emergencies} reports={reports} logs={logs} />}
      </div>
    </>
  )
}
