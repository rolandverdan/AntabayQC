import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { NAV_ITEMS, LOGOUT_ITEM } from './navItems.js'

// `expanded` is false only on desktop when the sidebar is collapsed and not hovered/focused.
// On screens below lg the sidebar is an off-canvas drawer that always shows labels.
export default function Sidebar({
  expanded,
  mobileOpen,
  onCloseMobile,
  onLogout,
  onHoverChange,
  items = NAV_ITEMS,
  commuterMode = false,
  navLabel,
  profileName,
  profileEmail,
  profileOpen = false,
  onProfileToggle,
}) {
  const { pathname } = useLocation()
  const LogoutIcon = LOGOUT_ITEM.icon
  const profileInitials = profileName?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  const labelCls = `admin-sidebar-label truncate whitespace-nowrap transition-opacity duration-300 ${expanded ? '' : 'lg:pointer-events-none lg:opacity-0'}`
  const itemBase = 'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-150'
  const navClass = ({ isActive }) =>
    `${itemBase} ${isActive ? 'bg-white text-navy shadow-sm' : 'text-blue-100 hover:bg-white/10 hover:text-white'}`

  // `also` lists extra paths that should keep an item highlighted (e.g. Support covers Lost Item / Report / Feedback).
  const alsoActive = (also) => !!also?.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  const renderLink = ({ to, label, icon: Icon, also }) => (
    <NavLink key={to} to={to} title={label} className={({ isActive }) => navClass({ isActive: isActive || alsoActive(also) })}>
      {({ isActive }) => (
        <>
          <Icon size={19} className={`shrink-0 ${isActive || alsoActive(also) ? 'text-brand' : ''}`} />
          <span className={labelCls}>{label}</span>
        </>
      )}
    </NavLink>
  )

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onCloseMobile} />}
      <aside
        // Hover only reacts to a real mouse; touch devices use the menu button in the header.
        onPointerEnter={(e) => e.pointerType === 'mouse' && onHoverChange(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && onHoverChange(false)}
        onFocus={() => onHoverChange(true)}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) onHoverChange(false) }}
        className={`admin-sidebar fixed left-0 top-[var(--topbar-h)] z-40 flex h-[calc(100dvh-var(--topbar-h))] w-64 flex-col overflow-hidden bg-brand text-white shadow-xl transition-[width,transform] duration-300 ease-in-out lg:translate-x-0 ${
          expanded ? 'lg:w-64' : 'lg:w-[76px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4" aria-label={navLabel || (commuterMode ? 'Commuter navigation' : 'Admin navigation')}>
          {items.map(renderLink)}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-white/10 px-3 py-3">
          {profileName ? (
            <>
              {profileOpen && (
                <div className="mb-1 rounded-lg bg-white/10 p-2 text-sm">
                  <p className="truncate px-2 font-semibold">{profileName}</p>
                  <p className="mb-2 truncate border-b border-white/10 px-2 pb-2 text-xs text-blue-100">{profileEmail}</p>
                  <button
                    type="button"
                    onClick={() => { onProfileToggle(false); onLogout() }}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-blue-100 hover:bg-red-500/90 hover:text-white"
                  >
                    <LogoutIcon size={17} className="shrink-0" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => onProfileToggle(!profileOpen)}
                title={profileName}
                aria-label="Administrator profile"
                aria-expanded={profileOpen}
                className={`${itemBase} w-full text-blue-100 hover:bg-white/10 hover:text-white`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-brand">{profileInitials}</span>
                <span className={`${labelCls} min-w-0 flex-1 text-left`}>
                  <span className="block truncate font-semibold">{profileName}</span>
                  <span className="block text-[10px] text-cyan-100">Administrator</span>
                </span>
                {expanded && (profileOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onLogout}
              title={LOGOUT_ITEM.label}
              className={`${itemBase} w-full text-blue-100 hover:bg-red-500/90 hover:text-white`}
            >
              <LogoutIcon size={19} className="shrink-0" />
              <span className={labelCls}>{LOGOUT_ITEM.label}</span>
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
