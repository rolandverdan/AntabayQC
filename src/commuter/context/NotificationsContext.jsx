import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { INITIAL_NOTIFICATIONS } from '../data/notifications.js'

const Ctx = createContext(null)

// One notification list for the whole commuter side, so the bell, Home and the Notifications page always agree.
export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)

  const markRead = useCallback((id) => {
    setNotifications((items) => items.map((item) => (item.id === id ? { ...item, unread: false } : item)))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((items) => items.map((item) => ({ ...item, unread: false })))
  }, [])

  const value = useMemo(
    () => ({ notifications, unreadCount: notifications.filter((n) => n.unread).length, markRead, markAllRead }),
    [notifications, markRead, markAllRead],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useNotifications() {
  return useContext(Ctx)
}
