import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { useNotifications } from '../context/NotificationsContext.jsx'
import { TONE_CLASSES } from '../data/notifications.js'

// Bell icon + drop-down for the top navbar (same pattern as the Admin / Conductor headers).
export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const close = () => setOpen(false)

  const openItem = (id) => {
    markRead(id)
    close()
    navigate('/commuter/notification')
  }

  return (
    <div className="relative z-20">
      {open && <button type="button" aria-label="Close notifications" className="fixed inset-0 z-10 cursor-default" onClick={close} />}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <Bell size={21} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-[calc(var(--topbar-h)+0.5rem)] z-20 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notifications</p>
            <button
              type="button"
              onClick={markAllRead}
              disabled={!unreadCount}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-brand hover:bg-brand/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <CheckCheck size={14} /> Mark all as read
            </button>
          </div>

          <ul className="max-h-[60dvh] divide-y divide-slate-100 overflow-y-auto">
            {notifications.map(({ id, title, detail, time, icon: Icon, tone, unread }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => openItem(id)}
                  className={`flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-slate-50 ${unread ? 'bg-slate-50/70' : ''}`}
                >
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE_CLASSES[tone]}`}>
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-semibold text-navy">{title}</span>
                      {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-slate-500">{detail}</span>
                    <span className="mt-0.5 block text-[11px] text-slate-400">{time}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <Link to="/commuter/notification" onClick={close} className="mt-1 block rounded-lg px-2 py-2 text-center text-sm font-semibold text-brand hover:bg-brand/5">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}
