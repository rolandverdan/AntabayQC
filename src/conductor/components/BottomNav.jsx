import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../layouts/navItems.js'

// Phone navigation for the Conductor side. Hidden from lg up, where the sidebar takes over.
export default function BottomNav() {
  return (
    <nav
      aria-label="Conductor navigation"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white shadow-[0_-4px_16px_rgba(15,23,42,0.08)] lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex min-h-[60px] flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand ${
                  isActive ? 'bg-brand/10 text-brand' : 'text-slate-500 active:bg-slate-100'
                }`
              }
            >
              <Icon size={22} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
