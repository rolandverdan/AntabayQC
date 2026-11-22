import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../layouts/navItems.js'
import { useConductor } from '../context/ConductorContext.jsx'

// Phone / tablet navigation for the Conductor side (below lg). From lg up the sidebar takes over.
// - Height comes from --bottom-nav-item-h (index.css) so the page padding in ConductorLayout always matches.
// - pb-safe keeps the items clear of the iOS home indicator; side insets cover landscape notches.
// - SOS is deliberately NOT here: it lives in the header so it never competes with navigation.
export default function BottomNav() {
  const { unreadAlerts } = useConductor()
  const orderedItems = ['Camera', 'Settings', 'Map', 'Notifications', 'Account']
    .map((label) => NAV_ITEMS.find((item) => item.label === label))
    .filter(Boolean)

  const renderItem = ({ to, label, mobileLabel, icon: Icon }) => (
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
            <span className={`relative flex h-7 w-14 items-center justify-center rounded-full transition [@media(max-height:480px)]:h-auto [@media(max-height:480px)]:w-auto [@media(max-height:480px)]:bg-transparent ${isActive ? 'bg-brand/12' : ''}`}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
              {label === 'Notifications' && unreadAlerts > 0 && (
                <span className="absolute right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {unreadAlerts > 9 ? '9+' : unreadAlerts}
                </span>
              )}
            </span>
            <span>{mobileLabel || label}{label === 'Notifications' && unreadAlerts > 0 && <span className="sr-only"> ({unreadAlerts} new)</span>}</span>
          </>
        )}
      </NavLink>
    </li>
  )

  return (
    <nav
      aria-label="Conductor navigation"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] shadow-[0_-4px_16px_rgba(15,23,42,0.08)] lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {orderedItems.map(renderItem)}
      </ul>
    </nav>
  )
}
