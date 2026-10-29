import { Home, Map, Route, LifeBuoy, UserRound, Settings } from 'lucide-react'

// Lost Item, Incident Report and Feedback live together under "Support" so the menu stays short.
// `also` keeps an item highlighted on its related pages.
export const NAV_ITEMS = [
  { to: '/commuter/home', label: 'Home', icon: Home },
  { to: '/commuter/route-and-schedule', label: 'Bus Routes', icon: Route, also: ['/commuter/timetable'] },
  { to: '/commuter/live-tracking', label: 'Live Tracking', icon: Map },
  {
    to: '/commuter/support',
    label: 'Support',
    icon: LifeBuoy,
    also: ['/commuter/lost-item', '/commuter/lost-item-reports', '/commuter/report', '/commuter/feedback'],
  },
  { to: '/commuter/my-trip', label: 'My Trip', icon: UserRound },
  { to: '/commuter/settings', label: 'Settings', icon: Settings },
]

// Phone bottom bar: the five everyday destinations. Settings sits in the profile menu, Notifications in the bell.
export const BOTTOM_NAV = NAV_ITEMS.filter((item) => item.to !== '/commuter/settings')

// Guests only get the live map. Everything else needs a commuter account.
export const GUEST_HOME = '/commuter/live-tracking'
export const GUEST_ALLOWED = [GUEST_HOME]
export const isGuestAllowed = (pathname) => GUEST_ALLOWED.some((p) => pathname === p || pathname.startsWith(`${p}/`))
export const navItemsFor = (isGuest) => (isGuest ? NAV_ITEMS.filter((i) => i.to === GUEST_HOME) : NAV_ITEMS)
export const bottomNavFor = (isGuest) => (isGuest ? NAV_ITEMS.filter((i) => i.to === GUEST_HOME) : BOTTOM_NAV)

export const isNavActive = (pathname, item) =>
  [item.to, ...(item.also || [])].some((p) => pathname === p || pathname.startsWith(`${p}/`))

export const PAGE_TITLES = [
  ['/commuter/home', 'Home'],
  ['/commuter/route-and-schedule', 'Bus Routes'],
  ['/commuter/timetable', 'Timetable'],
  ['/commuter/live-tracking', 'Live Tracking'],
  ['/commuter/support', 'Support'],
  ['/commuter/lost-item', 'Lost Item'],
  ['/commuter/report', 'Incident Report'],
  ['/commuter/feedback', 'Feedback'],
  ['/commuter/notification', 'Notifications'],
  ['/commuter/my-trip', 'My Trip'],
  ['/commuter/settings', 'Settings'],
]

export const pageTitle = (pathname) => PAGE_TITLES.find(([p]) => pathname === p || pathname.startsWith(`${p}/`))?.[1] || 'Home'
