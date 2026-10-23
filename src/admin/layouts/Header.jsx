import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Settings, Siren, FileText } from 'lucide-react'
import { NAV_ITEMS, EXPORT_ITEM } from './navItems.js'
import { useAdminData } from '../context/AdminDataContext.jsx'

export default function Header({ collapsed, onToggleCollapse, onOpenMobile, onLogout }) {
  const { settings, emergencies, reports } = useAdminData()
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(null) // 'bell' | 'profile' | null

  const title = [...NAV_ITEMS, EXPORT_ITEM].find((n) => pathname.startsWith(n.to))?.label || 'Admin'
  const activeEmergencies = emergencies.filter((e) => e.status !== 'Resolved').length
  const pendingReports = reports.filter((r) => r.status === 'Pending').length
  const alertCount = settings.notifications.emergency || settings.notifications.reports
    ? (settings.notifications.emergency ? activeEmergencies : 0) + (settings.notifications.reports ? pendingReports : 0)
    : 0
  const initials = settings.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const close = () => setMenu(null)

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/10 bg-brand px-4 text-white shadow-md">
      <button type="button" onClick={onOpenMobile} aria-label="Open menu" className="rounded-md p-2 hover:bg-white/10 lg:hidden">
        <Menu size={20} />
      </button>
      <button type="button" onClick={onToggleCollapse} aria-label={collapsed ? 'Pin sidebar open' : 'Collapse sidebar (expand on hover)'} title={collapsed ? 'Pin sidebar open' : 'Collapse sidebar (expand on hover)'} className="hidden rounded-md p-2 hover:bg-white/10 lg:block">
        {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
      </button>
      <h1 className="truncate text-lg font-bold">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        {menu && <button type="button" aria-label="Close menu" className="fixed inset-0 z-10 cursor-default" onClick={close} />}

        <div className="relative z-20">
          <button type="button" onClick={() => setMenu(menu === 'bell' ? null : 'bell')} aria-label="Notifications" className="relative rounded-full p-2 hover:bg-white/10">
            <Bell size={20} />
            {alertCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold">
                {alertCount}
              </span>
            )}
          </button>
          {menu === 'bell' && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-xl">
              <p className="px-2 py-1 text-xs font-semibold uppercase text-slate-400">Notifications</p>
              <Link to="/admin/emergency-logs" onClick={close} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                <Siren size={18} className="text-red-600" />
                <span>{activeEmergencies} active emergency incident{activeEmergencies === 1 ? '' : 's'}</span>
              </Link>
              <Link to="/admin/report-logs" onClick={close} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                <FileText size={18} className="text-amber-600" />
                <span>{pendingReports} pending report{pendingReports === 1 ? '' : 's'}</span>
              </Link>
              {!settings.notifications.emergency && !settings.notifications.reports && (
                <p className="px-2 py-1 text-xs text-slate-500">Alert badges are turned off in Settings.</p>
              )}
            </div>
          )}
        </div>

        <div className="relative z-20">
          <button type="button" onClick={() => setMenu(menu === 'profile' ? null : 'profile')} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-white/10" aria-label="Profile menu">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-brand">{initials}</span>
            <span className="hidden text-left text-xs leading-tight sm:block">
              <span className="block max-w-32 truncate font-semibold">{settings.name}</span>
              <span className="block text-[10px] text-cyan-100">Administrator</span>
            </span>
            <ChevronDown size={14} />
          </button>
          {menu === 'profile' && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-xl">
              <div className="border-b border-slate-100 px-2 pb-2">
                <p className="truncate font-semibold text-navy">{settings.name}</p>
                <p className="truncate text-xs text-slate-500">{settings.email}</p>
              </div>
              <Link to="/admin/settings" onClick={close} className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50">
                <Settings size={16} /> Settings
              </Link>
              <button type="button" onClick={() => { close(); onLogout() }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-red-600 hover:bg-red-50">
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
