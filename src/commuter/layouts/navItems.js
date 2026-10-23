import {
  Home,
  Map,
  Route,
  BusFront,
  CircleAlert,
  MessageSquareText,
  Bell,
  Settings,
  UserRound,
  Clock3,
  FileText,
} from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/commuter/home', label: 'Home', icon: Home },
  { to: '/commuter/route-and-schedule', label: 'Bus Routes', icon: Route },
  { to: '/commuter/timetable', label: 'Timetable', icon: Clock3 },
  { to: '/commuter/live-tracking', label: 'Live Tracking', icon: Map },
  { to: '/commuter/lost-item', label: 'Lost Item', icon: BusFront },
  { to: '/commuter/lost-item-reports', label: 'Lost Item Report', icon: FileText },
  { to: '/commuter/report', label: 'Report', icon: CircleAlert },
  { to: '/commuter/feedback', label: 'Feedback', icon: MessageSquareText },
  { to: '/commuter/notification', label: 'Notification', icon: Bell },
  { to: '/commuter/settings', label: 'Settings', icon: Settings },
  { to: '/commuter/my-trip', label: 'My Trip', icon: UserRound },
]

export const LOGOUT_ITEM = { label: 'Logout', icon: Settings }
