import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import Sidebar from '../../admin/layouts/Sidebar.jsx'
import CommuterHeader from './CommuterHeader.jsx'
import BottomNav from './BottomNav.jsx'
import ConfirmDialog from '../../admin/components/ConfirmDialog.jsx'
import { navItemsFor } from './navItems.js'
import { NotificationsProvider } from '../context/NotificationsContext.jsx'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'
import { useCommuter } from '../context/CommuterContext.jsx'

const noop = () => {}

export default function CommuterLayout() {
  const { settings, buses, routes } = useAdminData()
  const navigate = useNavigate()
  const { session, leave } = useCommuter()
  const isGuest = session?.mode === 'guest'
  const locked = !!useLocation().state?.locked
  const [confirmLogout, setConfirmLogout] = useState(false)

  const activeBuses = buses.filter((b) => b.status === 'Active').length
  const activeRoutes = routes.filter((r) => r.status === 'Active').length

  const doLogout = () => {
    setConfirmLogout(false)
    leave()
    navigate('/', { replace: true })
  }

  return (
    <NotificationsProvider>
      <div className="commuter-layout mobile-ui min-h-screen bg-[#eef3f7]" data-density={settings.density}>
        {/* Desktop: sidebar always open with labels (easier to read). Phones: bottom bar instead. */}
        <Sidebar
          expanded
          onHoverChange={noop}
          mobileOpen={false}
          onCloseMobile={noop}
          onLogout={() => setConfirmLogout(true)}
          commuterMode
          items={navItemsFor(isGuest)}
        />

        <div className="pt-[var(--topbar-h)] lg:pl-64">
          <CommuterHeader isGuest={isGuest} onLogout={() => setConfirmLogout(true)} meta={`${activeBuses} buses · ${activeRoutes} routes`} />

          <main className="px-4 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] pt-3 md:px-6 lg:pb-6">
            {isGuest && (
              <div className={`mb-3 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${locked ? 'border-amber-300 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-navy">{locked ? 'That page needs a commuter account' : "You're browsing as a guest"}</p>
                  <p className="mt-0.5 text-xs text-slate-600">Sign up for free to see bus routes and timetables, save trips, get notifications and report lost items.</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link to="/signup" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"><UserPlus size={15} />Sign up</Link>
                  <Link to="/" onClick={() => leave()} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-navy hover:bg-slate-50">Log in</Link>
                </div>
              </div>
            )}
            <Outlet />
          </main>
        </div>

        <BottomNav />
        <ConfirmDialog
          open={confirmLogout}
          title="Log out?"
          message={
            isGuest
              ? 'You will exit guest mode and return to the ANTABAY QC home page.'
              : 'You will be returned to the ANTABAY QC home page and will need to sign in again to access the commuter pages.'
          }
          confirmLabel="Log out"
          tone="primary"
          onConfirm={doLogout}
          onCancel={() => setConfirmLogout(false)}
        />
      </div>
    </NotificationsProvider>
  )
}
