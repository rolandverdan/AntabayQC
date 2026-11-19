import { Link, useLocation } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { LogoTile } from '../../shared/components/Logo.jsx'
import NotificationBell from '../components/NotificationBell.jsx'
import { pageTitle } from './navItems.js'

// Full-width sticky top bar. Navigation lives in the bottom bar / sidebar.
export default function CommuterHeader({ isGuest = false }) {
  const { pathname } = useLocation()

  return (
    <header className="pt-safe fixed inset-x-0 top-0 z-50 flex h-[var(--topbar-h)] items-center border-b border-white/10 bg-brand pr-2 text-white shadow-md sm:pr-4">
      <Link to={isGuest ? '/commuter/live-tracking' : '/commuter/home'} className="flex shrink-0 items-center gap-2 pl-3 lg:w-64 lg:pl-[18px]" aria-label="ANTABAY QC Commuter Console, go to Home">
        <LogoTile size="sm" />
        <span className="hidden min-w-0 whitespace-nowrap leading-tight lg:block">
          <span className="block text-sm font-bold tracking-wide">ANTABAY QC</span>
          <span className="block text-[11px] text-blue-200">Commuter Console</span>
        </span>
      </Link>

      <div className="min-w-0 pl-1 lg:pl-6">
        <h1 className="truncate text-base font-bold leading-tight lg:text-lg">{pageTitle(pathname)}</h1>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {!isGuest && <NotificationBell />}
        {isGuest && (
          <Link to="/signup" className="mr-1 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-bold text-brand shadow-sm transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
            <UserPlus size={14} /> Sign up
          </Link>
        )}
      </div>
    </header>
  )
}
