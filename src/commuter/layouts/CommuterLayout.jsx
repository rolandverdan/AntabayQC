import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../../admin/layouts/Sidebar.jsx'
import CommuterHeader from './CommuterHeader.jsx'
import BottomNav from './BottomNav.jsx'
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

  const activeBuses = buses.filter((b) => b.status === 'Active').length
  const activeRoutes = routes.filter((r) => r.status === 'Active').length

  const handleLogout = () => {
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
          onLogout={handleLogout}
          commuterMode
          items={navItemsFor(isGuest)}
        />

        <div className="pt-[var(--topbar-h)] lg:pl-64">
          <CommuterHeader isGuest={isGuest} onLogout={handleLogout} meta={`${activeBuses} buses · ${activeRoutes} routes`} />

          <main className="px-4 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] pt-3 md:px-6 lg:pb-6">
            <Outlet />
          </main>
        </div>

        <BottomNav />
      </div>
    </NotificationsProvider>
  )
}
