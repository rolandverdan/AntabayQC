import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, LogOut, UserPlus, UserRound } from 'lucide-react'
import { LogoTile } from '../../shared/components/Logo.jsx'
import NotificationBell from '../components/NotificationBell.jsx'
import { isNavActive, navItemsFor, pageTitle } from './navItems.js'
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

// Full-width sticky top bar with horizontal navigation on desktop and a compact title on phones.
export default function CommuterHeader({ isGuest = false, onLogout }) {
  const { pathname } = useLocation()
  const { session, userProfile } = useCommuter()
  const [menuOpen, setMenuOpen] = useState(false)
  const navItems = navItemsFor(isGuest).filter((item) => item.to !== '/commuter/settings')
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
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="pt-safe fixed inset-x-0 top-0 z-50 flex h-[var(--topbar-h)] items-center border-b border-white/10 bg-brand pr-2 text-white shadow-md sm:pr-4">
      <Link to={isGuest ? '/commuter/live-tracking' : '/commuter/home'} className="flex shrink-0 items-center gap-2 pl-3 lg:pl-[18px]" aria-label="ANTABAY QC Commuter Console, go to Home">
        <LogoTile size="sm" />
        <span className="hidden min-w-0 whitespace-nowrap leading-tight lg:block">
          <span className="block text-sm font-bold tracking-wide">ANTABAY QC</span>
          <span className="block text-[11px] text-blue-200">Commuter Console</span>
        </span>
      </Link>

      <h1 className="min-w-0 truncate pl-2 text-base font-bold leading-tight lg:hidden">{pageTitle(pathname)}</h1>

      <nav className="hidden min-w-0 flex-1 items-center justify-center gap-2 px-2 lg:flex" aria-label="Commuter navigation">
        {navItems.map((item) => {
          const { to, label } = item
          const active = isNavActive(pathname, item)
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${
                active ? 'bg-white text-navy' : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="ml-auto flex items-center gap-1">
        {isGuest && (
          <Link to="/signup" className="mr-1 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-bold text-brand shadow-sm transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
            <UserPlus size={14} /> Sign up
          </Link>
        )}
        <div className="relative z-20">
          {menuOpen && <button type="button" aria-label="Close account menu" className="fixed inset-0 z-10 cursor-default" onClick={closeMenu} />}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="relative z-20 flex min-h-10 items-center gap-1.5 rounded-full py-1 pl-1 pr-1.5 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:pr-2"
            aria-label="Commuter account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-brand">{initials}</span>
            <span className="hidden max-w-28 text-left text-xs leading-tight md:block">
              <span className="block truncate font-semibold">{profile.name}</span>
              <span className="block text-[10px] text-cyan-100">Commuter account</span>
            </span>
            <ChevronDown size={14} />
          </button>
          {menuOpen && (
            <div role="menu" aria-label="Account options" className="absolute right-0 top-full z-30 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-xl">
              <div className="border-b border-slate-100 px-2 pb-2">
                <p className="truncate font-semibold text-navy">{profile.name}</p>
                <p className="truncate text-xs text-slate-500">{profile.email || (isGuest ? 'Guest access' : 'Commuter account')}</p>
              </div>
              {!isGuest && (
                <div className="border-b border-slate-100 py-1">
                  <NotificationBell onNavigate={closeMenu} />
                </div>
              )}
              {isGuest ? (
                <Link to="/signup" role="menuitem" onClick={closeMenu} className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2.5 font-semibold text-brand transition hover:bg-blue-50">
                  <UserPlus size={16} /> Create an account
                </Link>
              ) : (
                <Link to="/commuter/settings" role="menuitem" onClick={closeMenu} className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2.5 transition hover:bg-slate-50">
                  <UserRound size={16} /> Profile &amp; Settings
                </Link>
              )}
              <button type="button" role="menuitem" onClick={() => { closeMenu(); onLogout?.() }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-red-600 transition hover:bg-red-50">
                <LogOut size={16} /> {isGuest ? 'Exit guest mode' : 'Log out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
