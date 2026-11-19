import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useNotifications } from '../context/NotificationsContext.jsx'

export default function NotificationBell({ onNavigate }) {
  const { unreadCount } = useNotifications()

  return (
    <Link
      to="/commuter/notification"
      role="menuitem"
      onClick={onNavigate}
      aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <Bell size={16} />
      <span className="text-sm font-medium">Notifications</span>
      {unreadCount > 0 && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
          {unreadCount}
        </span>
      )}
    </Link>
  )
}
