import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { NAV_ITEMS } from './navItems.js'
import TopBrand from '../../shared/components/TopBrand.jsx'
import { LogoTile } from '../../shared/components/Logo.jsx'

export default function Header({
  expanded,
  roleLabel = 'Admin',
  onOpenMobile,
  title,
  commuterMode = false,
  commuterMeta,
}) {
  const { pathname } = useLocation()

  const navItem = NAV_ITEMS.find((n) => pathname.startsWith(n.to))
  const defaultTitle = navItem ? navItem.title || navItem.label : pathname.startsWith('/admin/export') ? 'Export Data' : 'Admin'
  const headerTitle = title || defaultTitle

  return (
    <header className="pt-safe fixed inset-x-0 top-0 z-50 flex h-[var(--topbar-h)] items-center border-b border-white/10 bg-brand pr-4 text-white shadow-md">
      <button type="button" onClick={onOpenMobile} aria-label="Open menu" className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-white/10 lg:hidden">
        <Menu size={20} />
      </button>
      <span className="ml-1 lg:hidden"><LogoTile size="sm" /></span>
      <TopBrand expanded={expanded} roleLabel={roleLabel} persistent />
      {/* Admin page titles live in each page's header (below the navbar); only commuter mode keeps a title here. */}
      {commuterMode && (
        <div className="min-w-0 pl-3 lg:pl-6">
          <h1 className="truncate text-lg font-bold">{headerTitle}</h1>
          {commuterMeta && <p className="truncate text-[11px] text-cyan-100">{commuterMeta}</p>}
        </div>
      )}
    </header>
  )
}
