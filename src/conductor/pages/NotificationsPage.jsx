import { useEffect } from 'react'
import { Bell, Bus, Camera, Clock, LocateFixed, Route as RouteIcon, Siren, Trash2, Users } from 'lucide-react'
import Card from '../../admin/components/Card.jsx'
import Button from '../../admin/components/Button.jsx'
import { useConductor } from '../context/ConductorContext.jsx'

const CATEGORY_ICON = {
  passengerAlerts: Users,
  trip: RouteIcon,
  camera: Camera,
  gps: LocateFixed,
  sos: Siren,
  system: Bus,
}

const TONE = {
  danger: 'bg-red-100 text-red-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-sky-100 text-sky-700',
}

const dayAndTime = (time) => new Date(time).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

// Alerts raised on this phone: bus full / overboard, camera lost, GPS lost, trip started/ended, SOS.
export default function NotificationsPage() {
  const { settings, alerts, markAlertsRead, clearAlerts } = useConductor()
  // Passenger load alerts follow the Settings switch; the rest are always shown.
  const visible = alerts.filter((alert) => alert.category !== 'passengerAlerts' || settings.notifications.passengerAlerts)

  // Opening this page counts as reading the alerts.
  useEffect(() => {
    markAlertsRead()
  }, [alerts.length, markAlertsRead])

  return (
    <div className="mx-auto max-w-3xl">
      <Card
        title="Recent alerts"
        action={alerts.length > 0 && <Button variant="secondary" size="sm" icon={Trash2} onClick={clearAlerts}>Clear</Button>}
        bodyClass="divide-y divide-slate-100 p-0"
      >
        {visible.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-10 text-center text-sm text-slate-500">
            <Bell size={28} className="mb-2 text-slate-300" />
            <p>No alerts yet.</p>
            <p className="mt-1 text-xs">You will see alerts here when the bus is full, a camera disconnects, GPS is lost, or a trip starts or ends.</p>
          </div>
        ) : visible.map((alert) => {
          const Icon = CATEGORY_ICON[alert.category] || Bell
          return (
            <article key={alert.id} className="flex gap-3 px-4 py-4">
              <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${TONE[alert.tone] || TONE.info}`}>
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <h3 className="font-semibold text-navy">{alert.title}</h3>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                    <Clock size={12} /> {dayAndTime(alert.at)}
                  </span>
                </div>
                {alert.body && <p className="mt-1 text-sm leading-relaxed text-slate-600">{alert.body}</p>}
              </div>
            </article>
          )
        })}
      </Card>
      {!settings.notifications.passengerAlerts && (
        <p className="mt-3 text-xs text-slate-500">Passenger load alerts are turned off in Settings.</p>
      )}
    </div>
  )
}
