import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useAdminData } from '../context/AdminDataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

export default function AdminLayout() {
  const { settings, addLog } = useAdminData()
  const { logout } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [hovered, setHovered] = useState(false)
  const expanded = hovered // pure hover: icons only, opens while the pointer / keyboard focus is on the sidebar
  const [mobileOpen, setMobileOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  useEffect(() => setMobileOpen(false), [pathname])

  const doLogout = () => {
    addLog({ action: 'Admin logged out', module: 'Authentication', description: 'Administrator signed out.' })
    setConfirmLogout(false)
    logout()
    notify('You have been logged out.', 'info')
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen" data-density={settings.density}>
      <Sidebar
        expanded={expanded}
        onHoverChange={setHovered}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={() => setConfirmLogout(true)}
      />
      <div className={`pt-[var(--topbar-h)] transition-[padding] duration-200 ease-out ${expanded ? 'lg:pl-64' : 'lg:pl-[76px]'}`}>
        <Header
          expanded={expanded}
          onOpenMobile={() => setMobileOpen(true)}
          onLogout={() => setConfirmLogout(true)}
        />
        <main className="px-4 pb-4 pt-3 md:px-6 md:pb-6">
          <Outlet />
        </main>
      </div>
      <ConfirmDialog
        open={confirmLogout}
        title="Log out?"
        message="You will be returned to the ANTABAY QC home page and will need to sign in again to access the admin pages."
        confirmLabel="Log out"
        tone="primary"
        onConfirm={doLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  )
}
