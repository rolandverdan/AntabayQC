import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../../admin/layouts/Sidebar.jsx'
import Header from '../../admin/layouts/Header.jsx'
import { NAV_ITEMS } from './navItems.js'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'
import { useCommuter } from '../context/CommuterContext.jsx'

const HIDDEN_PAGE_TITLES = {
  '/commuter/timetable': 'Timetable',
  '/commuter/lost-item-reports': 'Lost Item Report',
}

export default function CommuterLayout() {
  const { settings, buses, routes } = useAdminData()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { leave } = useCommuter()
  const [commuterPreferences, setCommuterPreferences] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('antabayqc_commuter_settings') || '{}')
      return { darkMode: false, compactView: false, ...saved.preferences }
    } catch {
      return { darkMode: false, compactView: false }
    }
  })

  const [collapsed, setCollapsed] = useState(true)
  const [hovered, setHovered] = useState(false)
  const expanded = !collapsed || hovered
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => setMobileOpen(false), [pathname])

  useEffect(() => {
    const syncPreferences = (event) => {
      if (event.detail?.preferences) {
        setCommuterPreferences((current) => ({ ...current, ...event.detail.preferences }))
        return
      }
      try {
        const saved = JSON.parse(localStorage.getItem('antabayqc_commuter_settings') || '{}')
        setCommuterPreferences((current) => ({ ...current, ...saved.preferences }))
      } catch {
        setCommuterPreferences({ darkMode: false, compactView: false })
      }
    }
    const syncStoredPreferences = (event) => {
      if (event.key === 'antabayqc_commuter_settings') syncPreferences({})
    }

    window.addEventListener('antabayqc:commuter-settings-updated', syncPreferences)
    window.addEventListener('storage', syncStoredPreferences)
    return () => {
      window.removeEventListener('antabayqc:commuter-settings-updated', syncPreferences)
      window.removeEventListener('storage', syncStoredPreferences)
    }
  }, [])

  const activeBuses = buses.filter((b) => b.status === 'Active').length
  const activeRoutes = routes.filter((r) => r.status === 'Active').length

  const title = NAV_ITEMS.find((item) => pathname === item.to)?.label
    || NAV_ITEMS.find((item) => pathname.startsWith(item.to))?.label
    || HIDDEN_PAGE_TITLES[pathname]
    || 'Home'
  const handleLogout = () => {
    leave()
    navigate('/', { replace: true })
  }

  return (
    <div
      className="commuter-layout min-h-screen bg-[#eef3f7]"
      data-density={commuterPreferences.compactView ? 'compact' : settings.density}
      data-theme={commuterPreferences.darkMode ? 'dark' : 'light'}
    >
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

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
