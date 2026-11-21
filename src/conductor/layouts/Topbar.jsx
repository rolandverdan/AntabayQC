import { useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Bell, Siren, Bus } from 'lucide-react'
import { LogoTile } from '../../shared/components/Logo.jsx'
import TopBrand from '../../shared/components/TopBrand.jsx'
import { NAV_ITEMS } from './navItems.js'
import { NOTIFICATIONS } from '../data/mock.js'
import { useConductor } from '../context/ConductorContext.jsx'

export default function Topbar({ expanded, onSos, assignment, route }) {
  const { pathname } = useLocation()
  const { settings } = useConductor()

  const title = NAV_ITEMS.find((n) => pathname.startsWith(n.to))?.label || 'Conductor'
  const alertCount = NOTIFICATIONS.filter((notification) => settings.notifications[notification.category]).length

  return (
    <header className="pt-safe fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-brand text-white shadow-md">
     <div className="flex h-16 items-center gap-2 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:gap-3 sm:pl-[max(1rem,env(safe-area-inset-left))] sm:pr-[max(1rem,env(safe-area-inset-right))] lg:pl-0">
      {/* Phones/tablets: small logo (no sidebar). Desktop: brand block sized to the sidebar below it. */}
      <LogoTile size="sm" className="lg:hidden" />
      <TopBrand expanded={expanded} roleLabel="Conductor Console" />

      <div className="min-w-0">
        <h1 className="truncate text-base font-bold sm:text-lg">{title}</h1>
        <p className="flex items-center gap-1.5 truncate text-[11px] text-cyan-100">
          <Bus size={12} /> {assignment?.bus ? `${assignment.bus.plate || assignment.bus.id} · ${route?.name || (assignment.bus.routeId ? 'Loading route…' : 'No route assigned')}` : assignment?.status === 'loading' ? 'Loading assignment…' : 'No bus assigned'}
        </p>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={onSos}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-bold text-white shadow-sm ring-1 ring-white/70 outline-none transition hover:bg-red-700 focus-visible:ring-4 focus-visible:ring-white sm:px-3.5 sm:text-sm"
        >
          <Siren size={16} />
          SOS
          <span className="sr-only">emergency report</span>
        </button>
        <Link
          to="/conductor/notifications"
          aria-label="Notifications"
          title="Notifications"
          className="relative hidden h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 lg:flex"
        >
          <Bell size={20} />
          {alertCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-slate-900">
              {alertCount}
            </span>
          )}
        </Link>
      </div>
     </div>
    </header>
  )
}
