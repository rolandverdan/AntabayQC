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

  const [collapsed, setCollapsed] = useState(settings.sidebarCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  useEffect(() => setMobileOpen(false), [pathname])

  const doLogout = () => {
    addLog({ action: 'Admin logged out', module: 'Authentication', description: 'Administrator signed out.' })
    setConfirmLogout(false)
    logout()
    notify('You have been logged out.', 'info')
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen" data-density={settings.density}>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={() => setConfirmLogout(true)}
      />
      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}`}>
        <Header
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onOpenMobile={() => setMobileOpen(true)}
          onLogout={() => setConfirmLogout(true)}
        />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <ConfirmDialog
        open={confirmLogout}
        title="Log out?"
        message="You will be returned to the login page and will need to sign in again to access the admin pages."
        confirmLabel="Log out"
        tone="primary"
        onConfirm={doLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  )
}
