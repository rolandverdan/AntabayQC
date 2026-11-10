import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useAdminData } from '../context/AdminDataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { signOutFirebaseUser } from '../../firebase/auth.js'

export default function AdminLayout() {
  const { settings, addLog, dataStatus, dataError, retryData } = useAdminData()
  const { user, logout } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [hovered, setHovered] = useState(false)
  const expanded = hovered // pure hover: icons only, opens while the pointer / keyboard focus is on the sidebar
  const [mobileOpen, setMobileOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  useEffect(() => setMobileOpen(false), [pathname])

  const doLogout = async () => {
    try {
      if (user?.firebaseAuthenticated) {
        try {
          await addLog({ action: 'Admin logged out', module: 'Authentication', description: 'Administrator signed out.' })
        } catch (error) {
          console.error('Could not write the logout audit log:', error)
          notify('You were signed out, but the logout could not be recorded.', 'error')
        }
        await signOutFirebaseUser()
      }
      setConfirmLogout(false)
      logout()
      if (!user?.firebaseAuthenticated) notify('You have been logged out.', 'info')
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Firebase sign-out failed:', error)
      notify('Could not sign out. Please try again.', 'error')
    }
  }

  if (dataStatus === 'loading') {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading administrator data…</div>
  }

  if (dataStatus === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-bold text-navy">Could not load administrator data</h1>
          <p className="mt-2 text-sm text-slate-600">{dataError}</p>
          <p className="mt-2 text-xs text-slate-500">Check your connection, Firebase setup, and published Firestore rules.</p>
          <button type="button" onClick={retryData} className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Retry</button>
        </div>
      </div>
    )
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
