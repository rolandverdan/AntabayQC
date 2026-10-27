import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
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
  commuterMeta = 'Commuter Console',
  roleLabel = 'Admin Console',
  navLabel,
}) {
  const LogoutIcon = LOGOUT_ITEM.icon
  const labelCls = `truncate whitespace-nowrap transition-opacity duration-200 ${expanded ? '' : 'lg:pointer-events-none lg:opacity-0'}`
  const itemBase = 'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-150'
  const navClass = ({ isActive }) =>
    `${itemBase} ${isActive ? 'bg-white text-navy shadow-sm' : 'text-blue-100 hover:bg-white/10 hover:text-white'}`

  const renderLink = ({ to, label, icon: Icon, mobileOnly }) => (
    <NavLink key={to} to={to} title={label} className={(state) => `${navClass(state)} ${mobileOnly ? 'lg:hidden' : ''}`}>
      {({ isActive }) => (
        <>
          <Icon size={19} className={`shrink-0 ${isActive ? 'text-brand' : ''}`} />
          <span className={labelCls}>{label}</span>
        </>
      )}
    </NavLink>
  )

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onCloseMobile} />}
      <aside
        // Hover only reacts to a real mouse; touch devices use the menu / pin buttons in the header.
        onPointerEnter={(e) => e.pointerType === 'mouse' && onHoverChange(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && onHoverChange(false)}
        onFocus={() => onHoverChange(true)}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) onHoverChange(false) }}
        className={`fixed left-0 top-0 z-40 flex h-full w-64 flex-col overflow-hidden bg-brand text-white shadow-xl transition-[width,transform] duration-200 ease-out lg:translate-x-0 ${
          expanded ? 'lg:w-64' : 'lg:w-[76px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-[18px]">
          <img
            src="/images/Antabay QC Logo.png"
            alt="Antabay QC"
            className="h-14 w-auto max-w-[44px] shrink-0 object-contain"
          />
          {!commuterMode && (
            <div className={`min-w-0 leading-tight ${labelCls}`}>
              <p className="truncate text-sm font-bold tracking-wide">ANTABAY QC</p>
              <p className="truncate text-[11px] text-blue-200">{roleLabel}</p>
            </div>
          )}
          <button type="button" onClick={onCloseMobile} aria-label="Close menu" className="ml-auto rounded-md p-1 hover:bg-white/10 lg:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4" aria-label={navLabel || (commuterMode ? 'Commuter navigation' : 'Admin navigation')}>
          {items.map(renderLink)}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-white/10 px-3 py-3">
          <button
            type="button"
            onClick={onLogout}
            title={LOGOUT_ITEM.label}
            className={`${itemBase} w-full text-blue-100 hover:bg-red-500/90 hover:text-white`}
          >
            <LogoutIcon size={19} className="shrink-0" />
            <span className={labelCls}>{LOGOUT_ITEM.label}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
