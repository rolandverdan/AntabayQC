import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, ChevronDown, Clock, LogOut, PanelLeftClose, PanelLeftOpen, Siren, Bus, TriangleAlert, Users, Megaphone, Settings as SettingsIcon } from 'lucide-react'
import { LogoTile } from '../../shared/components/Logo.jsx'
import TopBrand from '../../shared/components/TopBrand.jsx'
import { NAV_ITEMS } from './navItems.js'
import { NOTIFICATIONS, VEHICLE, ROUTE } from '../data/mock.js'
import { useConductor } from '../context/ConductorContext.jsx'

const CATEGORY_STYLE = {
  delays: { Icon: TriangleAlert, tone: 'bg-amber-100 text-amber-700' },
  passengerAlerts: { Icon: Users, tone: 'bg-sky-100 text-sky-700' },
  adminMessages: { Icon: Megaphone, tone: 'bg-indigo-100 text-indigo-700' },
}

export default function Topbar({ expanded, collapsed, onToggleCollapse, onSos, onLogout }) {
  const { profile, settings } = useConductor()
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(null) // 'bell' | 'profile' | null
  const close = () => setMenu(null)

  const title = NAV_ITEMS.find((n) => pathname.startsWith(n.to))?.label || 'Conductor'
  const alerts = NOTIFICATIONS.filter((n) => settings.notifications[n.category])
  const initials = profile.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  return (
    <header className="pt-safe sticky top-0 z-20 border-b border-white/10 bg-brand text-white shadow-md">
     <div className="flex h-16 items-center gap-2 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:gap-3 sm:pl-[max(1rem,env(safe-area-inset-left))] sm:pr-[max(1rem,env(safe-area-inset-right))] lg:pl-0">
      {/* Phones/tablets: small logo (no sidebar). Desktop: brand block sized to the sidebar below it. */}
      <LogoTile size="sm" className="lg:hidden" />
      <TopBrand expanded={expanded} roleLabel="Conductor Console" />
      <button type="button" onClick={onToggleCollapse} aria-label={collapsed ? 'Pin sidebar open' : 'Collapse sidebar (expand on hover)'} title={collapsed ? 'Pin sidebar open' : 'Collapse sidebar (expand on hover)'} className="hidden rounded-md p-2 hover:bg-white/10 lg:block">
        {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-base font-bold sm:text-lg">{title}</h1>
        <p className="flex items-center gap-1.5 truncate text-[11px] text-cyan-100">
          <Bus size={12} /> {VEHICLE.plate} · {ROUTE.name}
        </p>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        {menu && <button type="button" aria-label="Close menu" tabIndex={-1} className="fixed inset-0 z-10 cursor-default" onClick={close} />}

        <button
          type="button"
          onClick={onSos}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-bold text-white shadow-sm ring-1 ring-white/70 outline-none transition hover:bg-red-700 focus-visible:ring-4 focus-visible:ring-white sm:px-3.5 sm:text-sm"
        >
          <Siren size={16} />
          SOS
          <span className="sr-only">emergency report</span>
        </button>

        <div className="z-20 sm:relative">
          <button type="button" onClick={() => setMenu(menu === 'bell' ? null : 'bell')} aria-label="Notifications" aria-expanded={menu === 'bell'} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
            <Bell size={20} />
            {alerts.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-slate-900">{alerts.length}</span>
            )}
          </button>
          {menu === 'bell' && (
            <div
              role="dialog"
              aria-label="Notifications"
              className="fixed inset-x-3 top-[calc(var(--topbar-h,4rem)+0.5rem)] z-30 flex max-h-[min(70dvh,30rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-96"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="font-bold text-navy">Notifications</p>
                {alerts.length > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">{alerts.length} new</span>}
              </div>

              <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
                {alerts.length === 0 && (
                  <p className="px-4 py-8 text-center text-xs text-slate-500">
                    You're all caught up. Turn categories back on in Settings to see more.
                  </p>
                )}
                {alerts.map((n) => {
                  const { Icon, tone } = CATEGORY_STYLE[n.category] || CATEGORY_STYLE.adminMessages
                  return (
                    <div key={n.id} className="flex gap-3 px-4 py-3">
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon size={16} /></span>
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug text-navy">{n.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{n.body}</p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400"><Clock size={11} /> {n.time}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Link to="/conductor/settings" onClick={close} className="flex min-h-11 items-center justify-center gap-1.5 border-t border-slate-100 bg-slate-50 text-xs font-semibold text-brand hover:bg-slate-100">
                <SettingsIcon size={14} /> Notification settings
              </Link>
            </div>
          )}
        </div>

        <div className="relative z-20">
          <button type="button" onClick={() => setMenu(menu === 'profile' ? null : 'profile')} aria-label="Account menu" aria-expanded={menu === 'profile'} aria-haspopup="menu" className="flex min-h-11 items-center gap-1 rounded-full py-1 pl-1 pr-1.5 hover:bg-white/10 md:gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold text-brand">{initials}</span>
            <span className="hidden text-left text-xs leading-tight md:block">
              <span className="block max-w-32 truncate font-semibold">{profile.fullName}</span>
              <span className="block text-[10px] text-cyan-100">Conductor</span>
            </span>
            <ChevronDown size={16} className={`shrink-0 transition ${menu === 'profile' ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {menu === 'profile' && (
            <div role="menu" className="absolute right-0 mt-3 w-44 rounded-xl border border-slate-200 bg-white p-1.5 text-sm shadow-xl">
              <button type="button" role="menuitem" onClick={() => { close(); onLogout() }} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 font-medium text-red-600 hover:bg-red-50">
                <LogOut size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
     </div>
    </header>
  )
}
