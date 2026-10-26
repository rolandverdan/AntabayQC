import {
  LayoutDashboard, UserPlus, Bus, MapPin, Route, Map as MapIcon,
  ScrollText, FileText, Siren, Settings, LogOut,
} from 'lucide-react'

// Exact module order required for the sidebar. Logout is handled as an action, not a route.
export const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', title: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/accounts', label: 'Users', title: 'Driver & Conductor Accounts', icon: UserPlus },
  { to: '/admin/buses', label: 'Create Buses', title: 'Create Buses', icon: Bus },
  { to: '/admin/bus-stops', label: 'Create Bus Stops', title: 'Create Bus Stops', icon: MapPin },
  { to: '/admin/routes', label: 'Create Routes', title: 'Create Routes', icon: Route },
  { to: '/admin/map', label: 'Map', title: 'Live Bus Map', icon: MapIcon },
  { to: '/admin/logs', label: 'Logs', title: 'System Logs', icon: ScrollText },
  { to: '/admin/report-logs', label: 'Report Logs', title: 'Report Logs', icon: FileText },
  { to: '/admin/emergency-logs', label: 'Emergency Logs', title: 'Emergency Logs', icon: Siren },
  { to: '/admin/settings', label: 'Settings', title: 'Settings', icon: Settings },
]

export const LOGOUT_ITEM = { label: 'Logout', icon: LogOut }
