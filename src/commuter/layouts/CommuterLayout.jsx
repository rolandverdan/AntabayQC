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

  const [collapsed, setCollapsed] = useState(true)
  const [hovered, setHovered] = useState(false)
  const expanded = !collapsed || hovered
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => setMobileOpen(false), [pathname])

  const activeBuses = buses.filter((b) => b.status === 'Active').length
  const activeRoutes = routes.filter((r) => r.status === 'Active').length

  const title = NAV_ITEMS.find((item) => pathname === item.to)?.label
    || NAV_ITEMS.find((item) => pathname.startsWith(item.to))?.label
    || ({
      '/commuter/terms-and-conditions': 'Terms & Conditions',
      '/commuter/privacy-policy': 'Privacy Policy',
    }[pathname])
    || 'Home'
  const footerPageName = {
    '/commuter/home': 'Home',
    '/commuter/route-and-schedule': 'Routes & Schedules',
    '/commuter/timetable': 'Timetable',
    '/commuter/live-tracking': 'Live Tracking',
    '/commuter/my-trip': 'My Trips',
    '/commuter/lost-item': 'Lost Items',
    '/commuter/lost-item-reports': 'Lost Item Reports',
    '/commuter/report': 'Incident Reports',
    '/commuter/feedback': 'Feedback',
    '/commuter/notification': 'Notifications',
    '/commuter/settings': 'Settings',
    '/commuter/help-support': 'Help & Support',
  }[pathname] || title
  const handleLogout = () => {
    leave()
    navigate('/', { replace: true })
  }

  return (
    <div className="commuter-layout min-h-screen bg-[#eef3f7]" data-density={settings.density}>
      <Sidebar
        expanded={expanded}
        onHoverChange={setHovered}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={handleLogout}
        commuterMode
        items={NAV_ITEMS}
      />

      <div className={`transition-[padding] duration-200 ease-out ${expanded ? 'lg:pl-64' : 'lg:pl-[76px]'}`}>
        <Header
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onOpenMobile={() => setMobileOpen(true)}
          onLogout={handleLogout}
          title={title}
          commuterMode
          commuterMeta={`${activeBuses} buses · ${activeRoutes} routes`}
        />

        <main className="flex min-h-[calc(100vh-4rem)] flex-col p-4 md:min-h-0 md:p-6">
          <div className="flex-1">
            <Outlet />
          </div>
          <footer className="mt-auto border-t border-slate-200/80 pt-4 text-center text-[11px] leading-5 text-slate-500 md:hidden">
            Official City Bus {footerPageName} • Quezon City Government (QC Bus System)
          </footer>
        </main>
      </div>
    </div>
  )
}
