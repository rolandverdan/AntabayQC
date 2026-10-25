import { Map as MapIcon, Camera, Settings, UserRound, LogOut } from 'lucide-react'

// Order required by the brief. Logout is an action (with confirmation), not a route.
export const NAV_ITEMS = [
  { to: '/conductor/map', label: 'Map', icon: MapIcon },
  { to: '/conductor/camera', label: 'Camera', icon: Camera },
  { to: '/conductor/settings', label: 'Settings', icon: Settings },
  { to: '/conductor/account', label: 'Account', icon: UserRound },
]

export const LOGOUT_ITEM = { label: 'Logout', icon: LogOut }
