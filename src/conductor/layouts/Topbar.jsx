import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Siren, UserRound, Bus } from 'lucide-react'
import { NAV_ITEMS } from './navItems.js'
import { NOTIFICATIONS, VEHICLE, ROUTE } from '../data/mock.js'
import { useConductor } from '../context/ConductorContext.jsx'

export default function Topbar({ collapsed, onToggleCollapse, onOpenMobile, onSos, onLogout }) {
  const { profile, settings } = useConductor()
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(null) // 'bell' | 'profile' | null
  const close = () => setMenu(null)

  const title = NAV_ITEMS.find((n) => pathname.startsWith(n.to))?.label || 'Conductor'
  const alerts = NOTIFICATIONS.filter((n) => settings.notifications[n.category])
  const initials = profile.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  return (
    <header className="pt-safe sticky top-0 z-20 border-b border-white/10 bg-brand text-white shadow-md">
     <div className="flex h-16 items-center gap-3 px-4">
      <button type="button" onClick={onOpenMobile} aria-label="Open menu" className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-white/10 lg:hidden">
        <Menu size={20} />
      </button>
      <button type="button" onClick={onToggleCollapse} aria-label={collapsed ? 'Pin sidebar open' : 'Collapse sidebar (expand on hover)'} title={collapsed ? 'Pin sidebar open' : 'Collapse sidebar (expand on hover)'} className="hidden rounded-md p-2 hover:bg-white/10 lg:block">
        {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold">{title}</h1>
        <p className="flex items-center gap-1.5 truncate text-[11px] text-cyan-100">
          <Bus size={12} /> {VEHICLE.plate} · {ROUTE.name}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {menu && <button type="button" aria-label="Close menu" tabIndex={-1} className="fixed inset-0 z-10 cursor-default" onClick={close} />}

        <button
          type="button"
          onClick={onSos}
          className="flex min-h-11 items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white shadow-md ring-2 ring-white/80 outline-none transition hover:bg-red-700 focus-visible:ring-4 focus-visible:ring-white sm:px-4"
        >
          <Siren size={18} />
          SOS
          <span className="sr-only">emergency report</span>
        </button>

        <div className="relative z-20">
          <button type="button" onClick={() => setMenu(menu === 'bell' ? null : 'bell')} aria-label="Notifications" aria-expanded={menu === 'bell'} className="relative flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10">
            <Bell size={20} />
            {alerts.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-slate-900">{alerts.length}</span>
            )}
          </button>
          {menu === 'bell' && (
            <div className="absolute right-0 mt-2 max-h-[70dvh] w-80 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-xl">
              <p className="px-2 py-1 text-xs font-semibold text-slate-500">Notifications (sample)</p>
              {alerts.length === 0 && (
                <p className="px-2 py-3 text-xs text-slate-500">
                  No notifications. All categories are turned off in <Link to="/conductor/settings" onClick={close} className="font-semibold text-brand underline">Settings</Link>.
                </p>
              )}
              {alerts.map((n) => (
                <div key={n.id} className="rounded-lg px-2 py-2 hover:bg-slate-50">
                  <p className="font-semibold text-navy">{n.title}</p>
                  <p className="text-xs text-slate-600">{n.body}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-20">
          <button type="button" onClick={() => setMenu(menu === 'profile' ? null : 'profile')} aria-label="Account menu" aria-expanded={menu === 'profile'} className="flex min-h-11 items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-white/10">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-brand">{initials}</span>
            <span className="hidden text-left text-xs leading-tight md:block">
              <span className="block max-w-32 truncate font-semibold">{profile.fullName}</span>
              <span className="block text-[10px] text-cyan-100">Conductor</span>
            </span>
            <ChevronDown size={14} className="hidden sm:block" />
          </button>
          {menu === 'profile' && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-xl">
              <div className="border-b border-slate-100 px-2 pb-2">
                <p className="truncate font-semibold text-navy">{profile.fullName}</p>
                <p className="truncate text-xs text-slate-500">{profile.conductorId}</p>
              </div>
              <Link to="/conductor/account" onClick={close} className="mt-1 flex min-h-11 items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50">
                <UserRound size={16} /> Account
              </Link>
              <button type="button" onClick={() => { close(); onLogout() }} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-2 text-red-600 hover:bg-red-50">
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
     </div>
    </header>
  )
}
