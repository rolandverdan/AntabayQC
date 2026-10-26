import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, ChevronUp, LogOut, Menu, Settings, Siren, FileText, UserRound } from 'lucide-react'
import { NAV_ITEMS } from './navItems.js'
import TopBrand from '../../shared/components/TopBrand.jsx'
import { LogoTile } from '../../shared/components/Logo.jsx'
import { useAdminData } from '../context/AdminDataContext.jsx'

const COMMUTER_SETTINGS_KEY = 'antabayqc_commuter_settings'
const COMMUTER_SETTINGS_EVENT = 'antabayqc:commuter-settings-updated'
const DEFAULT_COMMUTER_PROFILE = { name: 'Commuter', email: '' }

function readCommuterProfile() {
  try {
    const stored = localStorage.getItem(COMMUTER_SETTINGS_KEY)
    const profile = stored ? JSON.parse(stored).profile : null
    return { ...DEFAULT_COMMUTER_PROFILE, ...profile }
  } catch {
    return DEFAULT_COMMUTER_PROFILE
  }
}

export default function Header({
  expanded,
  roleLabel = 'Admin Console',
  onOpenMobile,
  onLogout,
  title,
  commuterMode = false,
  commuterMeta,
}) {
  const { settings, emergencies, reports } = useAdminData()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(null) // 'bell' | 'profile' | null
  const [openList, setOpenList] = useState(null) // 'emergency' | 'reports' | null (notification drop-downs)
  const [commuterProfile, setCommuterProfile] = useState(readCommuterProfile)

  useEffect(() => {
    const syncProfile = (event) => {
      setCommuterProfile(event.detail?.profile || readCommuterProfile())
    }
    const syncStoredProfile = (event) => {
      if (event.key === COMMUTER_SETTINGS_KEY) setCommuterProfile(readCommuterProfile())
    }

    window.addEventListener(COMMUTER_SETTINGS_EVENT, syncProfile)
    window.addEventListener('storage', syncStoredProfile)
    return () => {
      window.removeEventListener(COMMUTER_SETTINGS_EVENT, syncProfile)
      window.removeEventListener('storage', syncStoredProfile)
    }
  }, [])

  const navItem = NAV_ITEMS.find((n) => pathname.startsWith(n.to))
  const defaultTitle = navItem ? navItem.title || navItem.label : pathname.startsWith('/admin/export') ? 'Export Data' : 'Admin'
  const headerTitle = title || defaultTitle
  const SEV_RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 }
  const activeList = emergencies.filter((e) => e.status !== 'Resolved').sort((a, b) => (SEV_RANK[a.severity] ?? 9) - (SEV_RANK[b.severity] ?? 9))
  const pendingList = reports.filter((r) => r.status === 'Pending')
  const activeEmergencies = activeList.length
  const pendingReports = pendingList.length
  const alertCount = settings.notifications.emergency || settings.notifications.reports
    ? (settings.notifications.emergency ? activeEmergencies : 0) + (settings.notifications.reports ? pendingReports : 0)
    : 0
  const initials = settings.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const commuterInitials = commuterProfile.name.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'C'
  const close = () => { setMenu(null); setOpenList(null) }

  // Opens the log page and tells it which rows to pulse (all of them, or just one).
  const goHighlight = (path, ids) => {
    close()
    navigate(path, { state: { highlight: ids, at: Date.now() } })
  }

  return (
    <header className="pt-safe fixed inset-x-0 top-0 z-50 flex h-[var(--topbar-h)] items-center border-b border-white/10 bg-brand pr-4 text-white shadow-md">
      <button type="button" onClick={onOpenMobile} aria-label="Open menu" className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-white/10 lg:hidden">
        <Menu size={20} />
      </button>
      <span className="ml-1 lg:hidden"><LogoTile size="sm" /></span>
      <TopBrand expanded={expanded} roleLabel={roleLabel} />
      <div className="min-w-0 pl-3 lg:pl-6">
        <h1 className="truncate text-lg font-bold">{headerTitle}</h1>
        {commuterMode && commuterMeta && <p className="truncate text-[11px] text-cyan-100">{commuterMeta}</p>}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {menu && <button type="button" aria-label="Close menu" className="fixed inset-0 z-10 cursor-default" onClick={close} />}

        {!commuterMode && (
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
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-xl">
                <p className="px-2 py-1 text-xs font-semibold uppercase text-slate-400">Notifications</p>
                <div className="max-h-[70vh] overflow-y-auto">
                  <NotifyRow
                    icon={Siren}
                    iconClass="text-red-600"
                    text={`${activeEmergencies} active emergency incident${activeEmergencies === 1 ? '' : 's'}`}
                    hint="Click to open and pulse all of them"
                    open={openList === 'emergency'}
                    onToggle={() => setOpenList(openList === 'emergency' ? null : 'emergency')}
                    onOpenAll={() => goHighlight('/admin/emergency-logs', activeList.map((e) => e.id))}
                    disabled={activeEmergencies === 0}
                    items={activeList.map((e) => ({ id: e.id, title: `${e.id} · ${e.type}`, sub: `${e.busId} · ${e.severity} · ${e.status}`, tone: e.severity === 'Critical' ? 'bg-red-500' : e.severity === 'High' ? 'bg-amber-500' : 'bg-slate-400' }))}
                    onPick={(id) => goHighlight('/admin/emergency-logs', [id])}
                  />
                  <NotifyRow
                    icon={FileText}
                    iconClass="text-amber-600"
                    text={`${pendingReports} pending report${pendingReports === 1 ? '' : 's'}`}
                    hint="Click to open and pulse all of them"
                    open={openList === 'reports'}
                    onToggle={() => setOpenList(openList === 'reports' ? null : 'reports')}
                    onOpenAll={() => goHighlight('/admin/report-logs', pendingList.map((r) => r.id))}
                    disabled={pendingReports === 0}
                    items={pendingList.map((r) => ({ id: r.id, title: `${r.id} · ${r.type}`, sub: `${r.busId} · ${r.priority} priority`, tone: r.priority === 'High' ? 'bg-amber-500' : 'bg-slate-400' }))}
                    onPick={(id) => goHighlight('/admin/report-logs', [id])}
                  />
                </div>
                {!settings.notifications.emergency && !settings.notifications.reports && (
                  <p className="px-2 py-1 text-xs text-slate-500">Alert badges are turned off in Settings.</p>
                )}
              </div>
            )}

            {commuterMode && (
              <div className="relative z-20">
                <button
                  type="button"
                  onClick={() => setMenu(menu === 'profile' ? null : 'profile')}
                  className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  aria-label="Commuter profile menu"
                  aria-expanded={menu === 'profile'}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-brand">
                    {commuterInitials}
                  </span>
                  <span className="hidden max-w-36 text-left text-xs leading-tight sm:block">
                    <span className="block truncate font-semibold">{commuterProfile.name}</span>
                    <span className="block text-[10px] text-cyan-100">Commuter profile</span>
                  </span>
                  <ChevronDown size={14} />
                </button>
                {menu === 'profile' && (
                  <div className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-xl">
                    <div className="border-b border-slate-100 px-2 pb-2">
                      <p className="truncate font-semibold text-navy">{commuterProfile.name}</p>
                      <p className="truncate text-xs text-slate-500">{commuterProfile.email || 'Commuter profile'}</p>
                    </div>
                    <Link to="/commuter/settings" onClick={close} className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-slate-50">
                      <UserRound size={16} /> Profile &amp; Settings
                    </Link>
                    <button type="button" onClick={() => { close(); onLogout() }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-red-600 transition hover:bg-red-50">
                      <LogOut size={16} /> Exit commuter view
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!commuterMode && (
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
        )}
      </div>
    </header>
  )
}

// One compiled notification: the main button opens the page and pulses everything in it;
// the chevron drops down the individual items so a single one can be picked.
function NotifyRow({ icon: Icon, iconClass, text, hint, open, onToggle, onOpenAll, disabled, items, onPick }) {
  return (
    <div className="rounded-lg">
      <div className="flex items-center gap-1 rounded-lg hover:bg-slate-50">
        <button type="button" onClick={onOpenAll} disabled={disabled} title={hint} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left disabled:opacity-60">
          <Icon size={18} className={`shrink-0 ${iconClass}`} />
          <span>{text}</span>
        </button>
        <button type="button" onClick={onToggle} disabled={disabled} aria-expanded={open} aria-label={open ? 'Hide list' : 'Show list'} className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-40">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {open && (
        <ul className="mb-1 ml-5 space-y-0.5 border-l border-slate-200 pl-2">
          {items.map((it) => (
            <li key={it.id}>
              <button type="button" onClick={() => onPick(it.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-slate-50">
                <span className={`h-2 w-2 shrink-0 rounded-full ${it.tone}`} />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-navy">{it.title}</span>
                  <span className="block truncate text-[11px] text-slate-500">{it.sub}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
