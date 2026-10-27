import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../layouts/navItems.js'

// Phone / tablet navigation for the Conductor side (below lg). From lg up the sidebar takes over.
// - Height comes from --bottom-nav-item-h (index.css) so the page padding in ConductorLayout always matches.
// - pb-safe keeps the items clear of the iOS home indicator; side insets cover landscape notches.
// - SOS is deliberately NOT here: it lives in the header so it never competes with navigation.
export default function BottomNav() {
  return (
    <nav
      aria-label="Conductor navigation"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] shadow-[0_-4px_16px_rgba(15,23,42,0.08)] lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex min-h-[var(--bottom-nav-item-h)] flex-col items-center justify-center gap-0.5 px-1 text-xs outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand [@media(max-height:480px)]:flex-row [@media(max-height:480px)]:gap-2 ${
                  isActive ? 'font-bold text-brand' : 'font-medium text-slate-600 active:bg-slate-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex h-7 w-14 items-center justify-center rounded-full transition [@media(max-height:480px)]:h-auto [@media(max-height:480px)]:w-auto [@media(max-height:480px)]:bg-transparent ${isActive ? 'bg-brand/12' : ''}`}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
