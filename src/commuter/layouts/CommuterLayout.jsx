import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../../admin/layouts/Sidebar.jsx'
import Header from '../../admin/layouts/Header.jsx'
import { NAV_ITEMS } from './navItems.js'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'
import { useCommuter } from '../context/CommuterContext.jsx'

export default function CommuterLayout() {
  const { settings, buses, routes } = useAdminData()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { leave } = useCommuter()

  const [hovered, setHovered] = useState(false)
  const expanded = hovered // pure hover: icons only, opens while the pointer / keyboard focus is on the sidebar
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => setMobileOpen(false), [pathname])

  const activeBuses = buses.filter((b) => b.status === 'Active').length
  const activeRoutes = routes.filter((r) => r.status === 'Active').length

  const title = NAV_ITEMS.find((item) => pathname === item.to)?.label
    || NAV_ITEMS.find((item) => pathname.startsWith(item.to))?.label
    || 'Home'
  const handleLogout = () => {
    leave()
    navigate('/', { replace: true })
  }

  return (
    <div className="commuter-layout mobile-ui min-h-screen bg-[#eef3f7]" data-density={settings.density}>
      <Sidebar
        expanded={expanded}
        onHoverChange={setHovered}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={handleLogout}
        commuterMode
        items={NAV_ITEMS}
      />

      <div className={`pt-[var(--topbar-h)] transition-[padding] duration-200 ease-out ${expanded ? 'lg:pl-64' : 'lg:pl-[76px]'}`}>
        <Header
          expanded={expanded}
          roleLabel="Commuter Console"
          onOpenMobile={() => setMobileOpen(true)}
          onLogout={handleLogout}
          title={title}
          commuterMode
          commuterMeta={`${activeBuses} buses · ${activeRoutes} routes`}
        />

        <main className="px-4 pb-4 pt-3 md:px-6 md:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
