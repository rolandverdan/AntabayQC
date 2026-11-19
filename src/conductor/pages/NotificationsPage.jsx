import { Clock, Megaphone, TriangleAlert, Users } from 'lucide-react'
import Card from '../../admin/components/Card.jsx'
import { NOTIFICATIONS } from '../data/mock.js'
import { useConductor } from '../context/ConductorContext.jsx'

const CATEGORY_STYLE = {
  delays: { Icon: TriangleAlert, tone: 'bg-amber-100 text-amber-700' },
  passengerAlerts: { Icon: Users, tone: 'bg-sky-100 text-sky-700' },
  adminMessages: { Icon: Megaphone, tone: 'bg-indigo-100 text-indigo-700' },
}

export default function NotificationsPage() {
  const { settings } = useConductor()
  const notifications = NOTIFICATIONS.filter((notification) => settings.notifications[notification.category])

  return (
    <div className="mx-auto max-w-3xl">
      <Card title="Recent notifications" bodyClass="divide-y divide-slate-100 p-0">
        {notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            No notifications are enabled. Turn on notification categories in Settings to see updates here.
          </p>
        ) : notifications.map((notification) => {
          const { Icon, tone } = CATEGORY_STYLE[notification.category] || CATEGORY_STYLE.adminMessages
          return (
            <article key={notification.id} className="flex gap-3 px-4 py-4">
              <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}>
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <h3 className="font-semibold text-navy">{notification.title}</h3>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                    <Clock size={12} /> {notification.time}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{notification.body}</p>
              </div>
            </article>
          )
        })}
      </Card>
    </div>
  )
}
