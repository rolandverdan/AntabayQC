import { NavLink } from 'react-router-dom'
import { Bus, X } from 'lucide-react'
import { NAV_ITEMS, LOGOUT_ITEM } from './navItems.js'

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile, onLogout }) {
  const labelCls = collapsed ? 'lg:hidden' : ''
  const LogoutIcon = LOGOUT_ITEM.icon

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onCloseMobile} />}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-64 flex-col bg-brand text-white shadow-xl transition-transform duration-200 lg:translate-x-0 ${
          collapsed ? 'lg:w-[76px]' : 'lg:w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand">
            <Bus size={22} />
          </div>
          <div className={`min-w-0 leading-tight ${labelCls}`}>
            <p className="truncate text-sm font-bold tracking-wide">ANTABAY QC</p>
            <p className="truncate text-[11px] text-blue-200">Admin Console</p>
          </div>
          <button type="button" onClick={onCloseMobile} aria-label="Close menu" className="ml-auto rounded-md p-1 hover:bg-white/10 lg:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-deep text-white shadow-inner' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                } ${collapsed ? 'lg:justify-center' : ''}`
              }
            >
              <Icon size={19} className="shrink-0" />
              <span className={`truncate ${labelCls}`}>{label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={onLogout}
            title={LOGOUT_ITEM.label}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-100 transition hover:bg-red-500/90 hover:text-white ${collapsed ? 'lg:justify-center' : ''}`}
          >
            <LogoutIcon size={19} className="shrink-0" />
            <span className={`truncate ${labelCls}`}>{LOGOUT_ITEM.label}</span>
          </button>
        </nav>
      </aside>
    </>
  )
}
