import {
  Home,
  Map,
  Route,
  BusFront,
  CircleAlert,
  MessageSquareText,
  Bell,
  CircleHelp,
  Settings,
  UserRound,
} from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/commuter/home', label: 'Home', icon: Home },
  { to: '/commuter/route-and-schedule', label: 'Bus Routes', icon: Route },
  { to: '/commuter/live-tracking', label: 'Live Tracking', icon: Map },
  { to: '/commuter/lost-item', label: 'Lost Item', icon: BusFront },
  { to: '/commuter/report', label: 'Incident Report', icon: CircleAlert },
  { to: '/commuter/feedback', label: 'Feedback', icon: MessageSquareText },
  { to: '/commuter/notification', label: 'Notification', icon: Bell },
  { to: '/commuter/my-trip', label: 'My Trip', icon: UserRound },
  { to: '/commuter/help', label: 'Help & Support', icon: CircleHelp },
  { to: '/commuter/settings', label: 'Settings', icon: Settings },
]

export const LOGOUT_ITEM = { label: 'Logout', icon: Settings }
