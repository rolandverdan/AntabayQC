import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { TriangleAlert, X } from 'lucide-react'
import Sidebar from '../../admin/layouts/Sidebar.jsx'
import { NAV_ITEMS } from './navItems.js'
import Topbar from './Topbar.jsx'
import BottomNav from '../components/BottomNav.jsx'
import SosModal from '../components/SosModal.jsx'
import ConfirmDialog from '../../admin/components/ConfirmDialog.jsx'
import { useConductor } from '../context/ConductorContext.jsx'
import { useToast } from '../../admin/context/ToastContext.jsx'
import useVehicleSim from '../utils/useVehicleSim.js'

export default function ConductorLayout() {
  const { logout, sosReport, setSosReport } = useConductor()
  const { notify } = useToast()
  const navigate = useNavigate()
  const sim = useVehicleSim()

  // Same behaviour as Admin: icon-only by default, expands while hovered/focused, pin button in the header.
  const [collapsed, setCollapsed] = useState(true)
  const [hovered, setHovered] = useState(false)
  const expanded = !collapsed || hovered
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [sosOpen, setSosOpen] = useState(false)

  const doLogout = () => {
    setConfirmLogout(false)
    logout()
    notify('You have been logged out.', 'info')
    navigate('/', { replace: true })
  }

  return (
    <div className="mobile-ui min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand">
        Skip to content
      </a>
      {/* Desktop sidebar. display:none below lg removes it (and its off-canvas links) from the tab order;
          phones and tablets use the bottom navigation instead. */}
      <div className="hidden lg:block">
        <Sidebar
          expanded={expanded}
          onHoverChange={setHovered}
          mobileOpen={false}
          onCloseMobile={() => {}}
          onLogout={() => setConfirmLogout(true)}
          items={NAV_ITEMS}
          roleLabel="Conductor Console"
          navLabel="Conductor navigation"
        />
      </div>
      <div className={`transition-[padding] duration-200 ease-out ${expanded ? 'lg:pl-64' : 'lg:pl-[76px]'}`}>
        <Topbar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} onSos={() => setSosOpen(true)} onLogout={() => setConfirmLogout(true)} />
        {sosReport && (
          <div role="status" className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            <TriangleAlert size={16} className="shrink-0" />
            <p className="min-w-0 flex-1">
              <span className="font-semibold">SOS report {sosReport.id}</span> · {sosReport.type} · Simulated, not transmitted.
            </p>
            <button type="button" onClick={() => setSosReport(null)} className="rounded p-1 hover:bg-amber-100" aria-label="Dismiss SOS banner">
              <X size={16} />
            </button>
          </div>
        )}
        {/* Bottom padding = bottom-nav height + breathing room, so the fixed nav never covers content. */}
        <main id="main" className="px-4 pt-4 pb-[calc(var(--bottom-nav-h)+1rem)] md:px-6 md:pt-6 lg:pb-6">
          <Outlet context={{ ...sim, requestLogout: () => setConfirmLogout(true) }} />
        </main>
      </div>

      <BottomNav />

      <SosModal open={sosOpen} onClose={() => setSosOpen(false)} location={sim.location} />
      <ConfirmDialog
        open={confirmLogout}
        title="Log out?"
        message="You will be returned to the ANTABAY QC home page and will need to sign in again to use the conductor pages."
        confirmLabel="Log out"
        tone="primary"
        onConfirm={doLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  )
}
