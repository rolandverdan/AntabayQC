import { NavLink } from 'react-router-dom'
import { NAV_ITEMS, LOGOUT_ITEM } from './navItems.js'
import { LogoTile } from '../../shared/components/Logo.jsx'

// Tablet / desktop only (lg+). Phones use the bottom navigation instead.
export default function Sidebar({ onLogout }) {
  const LogoutIcon = LOGOUT_ITEM.icon
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col bg-brand text-white shadow-xl lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <LogoTile size="sm" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-bold tracking-wide">ANTABAY QC</p>
          <p className="truncate text-[11px] text-blue-200">Conductor</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Conductor navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-white/70 ${
                isActive ? 'bg-white text-navy shadow-sm' : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={19} className={`shrink-0 ${isActive ? 'text-brand' : ''}`} />
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 px-3 py-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-blue-100 outline-none transition hover:bg-red-500/90 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <LogoutIcon size={19} className="shrink-0" />
          <span className="truncate">{LOGOUT_ITEM.label}</span>
        </button>
        <p className="mt-2 px-4 text-[11px] text-blue-200">Frontend demo · sample data</p>
      </div>
    </aside>
  )
}
