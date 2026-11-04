import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, LogOut, UserPlus, UserRound } from 'lucide-react'
import { LogoTile } from '../../shared/components/Logo.jsx'
import NotificationBell from '../components/NotificationBell.jsx'
import { pageTitle } from './navItems.js'
import { useCommuter } from '../context/CommuterContext.jsx'

const COMMUTER_SETTINGS_KEY = 'antabayqc_commuter_settings'
const DEFAULT_PROFILE = { name: 'Commuter', email: '' }

function readProfile() {
  try {
    const stored = localStorage.getItem(COMMUTER_SETTINGS_KEY)
    const profile = stored ? JSON.parse(stored).profile : null
    return { ...DEFAULT_PROFILE, ...profile }
  } catch {
    return DEFAULT_PROFILE
  }
}

// Full-width sticky top bar. The brand name + "Commuter Console" are always visible (phone and desktop),
// the notification bell sits next to the profile menu, and navigation lives in the bottom bar / sidebar.
export default function CommuterHeader({ onLogout, meta, isGuest = false }) {
  const { pathname } = useLocation()
  const { session, userProfile } = useCommuter()
  const [menuOpen, setMenuOpen] = useState(false)
  const cachedProfile = readProfile()
  const profile = session?.firebaseAuthenticated
    ? {
        name: userProfile?.displayName || session.identifier || 'Commuter',
        email: userProfile?.email || session.identifier || '',
      }
    : isGuest
      ? { name: 'Guest commuter', email: '' }
      : cachedProfile

  const initials = profile.name.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'C'
  const close = () => setMenuOpen(false)

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
        {meta && <p className="truncate text-[11px] text-cyan-100">{meta}</p>}
      </div>

      <div className="ml-auto flex items-center gap-1">
        {!isGuest && <NotificationBell />}
        {isGuest && (
          <Link to="/signup" className="mr-1 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-bold text-brand shadow-sm transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
            <UserPlus size={14} /> Sign up
          </Link>
        )}

        <div className="relative z-20">
          {menuOpen && <button type="button" aria-label="Close menu" className="fixed inset-0 z-10 cursor-default" onClick={close} />}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="relative z-20 flex min-h-11 items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label="Commuter profile menu"
            aria-expanded={menuOpen}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-brand">{initials}</span>
            <span className="hidden max-w-36 text-left text-xs leading-tight md:block">
              <span className="block truncate font-semibold">{profile.name}</span>
              <span className="block text-[10px] text-cyan-100">Commuter profile</span>
            </span>
            <ChevronDown size={14} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-xl">
              <div className="border-b border-slate-100 px-2 pb-2">
                <p className="truncate font-semibold text-navy">{profile.name}</p>
                <p className="truncate text-xs text-slate-500">{profile.email || 'Commuter profile'}</p>
              </div>
              {isGuest && (
                <Link to="/signup" onClick={close} className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2.5 font-semibold text-brand transition hover:bg-blue-50">
                  <UserPlus size={16} /> Create an account
                </Link>
              )}
              {!isGuest && (
                <Link to="/commuter/settings" onClick={close} className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2.5 transition hover:bg-slate-50">
                  <UserRound size={16} /> Profile &amp; Settings
                </Link>
              )}
              <button type="button" onClick={() => { close(); onLogout() }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-red-600 transition hover:bg-red-50">
                <LogOut size={16} /> {isGuest ? 'Exit guest mode' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
