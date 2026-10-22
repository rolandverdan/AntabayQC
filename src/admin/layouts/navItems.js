import {
  LayoutDashboard, UserPlus, Bus, MapPin, Route, Map as MapIcon,
  ScrollText, FileText, Siren, Settings, LogOut,
} from 'lucide-react'

// Exact module order required for the sidebar. Logout is handled as an action, not a route.
export const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/accounts', label: 'Create Account', icon: UserPlus },
  { to: '/admin/buses', label: 'Create Buses', icon: Bus },
  { to: '/admin/bus-stops', label: 'Create Bus Stops', icon: MapPin },
  { to: '/admin/routes', label: 'Create Routes', icon: Route },
  { to: '/admin/map', label: 'Map', icon: MapIcon },
  { to: '/admin/logs', label: 'Logs', icon: ScrollText },
  { to: '/admin/report-logs', label: 'Report Logs', icon: FileText },
  { to: '/admin/emergency-logs', label: 'Emergency Logs', icon: Siren },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export const LOGOUT_ITEM = { label: 'Logout', icon: LogOut }
