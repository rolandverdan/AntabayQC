import { LogoTile } from './Logo.jsx'

// Logo + name at the far left of the full-width header. Its width follows the sidebar below it
// (64 / 76px), so the logo sits right above the sidebar icons. Desktop only; phones use the menu button.
export default function TopBrand({ expanded, roleLabel }) {
  return (
    <div className={`hidden shrink-0 items-center gap-3 overflow-hidden pl-[18px] transition-[width] duration-200 ease-out lg:flex ${expanded ? 'w-64' : 'w-[76px]'}`}>
      <LogoTile size="sm" />
      <div className={`min-w-0 whitespace-nowrap leading-tight transition-opacity duration-200 ${expanded ? '' : 'opacity-0'}`}>
        <p className="truncate text-sm font-bold tracking-wide">ANTABAY QC</p>
        <p className="truncate text-[11px] text-blue-200">{roleLabel}</p>
      </div>
    </div>
  )
}
