import { Link, useLocation } from 'react-router-dom'
import { useCommuter } from '../context/CommuterContext.jsx'
import { bottomNavFor, isNavActive } from './navItems.js'

// Phone navigation: a fixed bottom bar like the apps people already use (IG, Messenger, Spotify).
// On desktop the sidebar takes over, so this is hidden from lg up.
export default function BottomNav() {
  const { pathname } = useLocation()
  const { session } = useCommuter()
  const items = bottomNavFor(session?.mode === 'guest')

  return (
    <nav
      aria-label="Commuter navigation"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white shadow-[0_-4px_16px_rgba(15,23,42,0.08)] lg:hidden"
    >
      <ul className={`grid ${items.length === 1 ? 'grid-cols-1' : 'grid-cols-5'}`}>
        {items.map((item) => {
          const active = isNavActive(pathname, item)
          const Icon = item.icon
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold transition-colors ${
                  active ? 'text-brand' : 'text-slate-500 hover:text-brand'
                }`}
              >
                {active && <span className="absolute inset-x-4 top-0 h-0.5 rounded-b-full bg-brand" />}
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
