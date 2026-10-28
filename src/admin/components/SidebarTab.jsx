import { ChevronLeft, ChevronRight } from 'lucide-react'

// Small tab on the sidebar's edge: pin the sidebar open, or collapse it back to icons. Desktop only.
export default function SidebarTab({ collapsed, expanded, onToggle, onHoverChange }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      onPointerEnter={(e) => e.pointerType === 'mouse' && onHoverChange(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && onHoverChange(false)}
      aria-label={collapsed ? 'Pin sidebar open' : 'Collapse sidebar to icons'}
      title={collapsed ? 'Pin sidebar open' : 'Collapse sidebar to icons'}
      style={{ left: expanded ? '16rem' : '76px' }}
      className="fixed top-[calc(var(--topbar-h)+1.5rem)] z-50 hidden h-10 w-6 items-center justify-center rounded-r-lg border border-l-0 border-slate-200 bg-white text-brand shadow-md outline-none transition-[left,color] duration-200 ease-out hover:text-brand-dark focus-visible:ring-2 focus-visible:ring-brand/40 lg:flex"
    >
      {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
    </button>
  )
}
