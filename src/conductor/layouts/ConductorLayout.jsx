import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { TriangleAlert, X } from 'lucide-react'
import Sidebar from '../../admin/layouts/Sidebar.jsx'
import { NAV_ITEMS } from './navItems.js'
import Topbar from './Topbar.jsx'
import SosModal from '../components/SosModal.jsx'
import ConfirmDialog from '../../admin/components/ConfirmDialog.jsx'
import { useConductor } from '../context/ConductorContext.jsx'
import { useToast } from '../../admin/context/ToastContext.jsx'
import useVehicleSim from '../utils/useVehicleSim.js'

export default function ConductorLayout() {
  const { logout, sosReport, setSosReport } = useConductor()
  const { notify } = useToast()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const sim = useVehicleSim()

  const [hovered, setHovered] = useState(false)
  const expanded = hovered // pure hover: icons only, opens while the pointer / keyboard focus is on the sidebar
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => setMobileOpen(false), [pathname])
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
      <Sidebar
        expanded={expanded}
        onHoverChange={setHovered}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={() => setConfirmLogout(true)}
        items={NAV_ITEMS}
        navLabel="Conductor navigation"
      />
      <div className={`pt-[var(--topbar-h)] transition-[padding] duration-200 ease-out ${expanded ? 'lg:pl-64' : 'lg:pl-[76px]'}`}>
        <Topbar expanded={expanded} onOpenMobile={() => setMobileOpen(true)} onSos={() => setSosOpen(true)} onLogout={() => setConfirmLogout(true)} />
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
        <main id="main" className="px-3 pb-4 pt-3 sm:px-4 md:px-6 md:pb-6">
          <Outlet context={sim} />
        </main>
      </div>

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
