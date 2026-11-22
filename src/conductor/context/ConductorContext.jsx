import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { initialProfile, initialSettings } from '../data/mock.js'

// The browser-stored session marker is UI state only; Firebase Authentication verifies identity.
// Profile, settings and SOS reports remain local to this browser session.
const SESSION_KEY = 'antabayqc_conductor_session'
const PASSENGER_COUNT_KEY = 'antabayqc_conductor_passenger_count_v1'
const Ctx = createContext(null)

function readPassengerTotals() {
  try {
    const raw = localStorage.getItem(PASSENGER_COUNT_KEY)
    if (!raw) return { count: 0, entries: 0, exits: 0 }
    const stored = JSON.parse(raw)
    if ([stored.count, stored.entries, stored.exits].every((value) => Number.isSafeInteger(value) && value >= 0)) {
      return stored
    }
    console.error('Stored conductor passenger count is invalid; starting a new local count.')
  } catch {
    console.error('Could not read the conductor passenger count from this browser.')
    return { count: 0, entries: 0, exits: 0 }
  }
  return { count: 0, entries: 0, exits: 0 }
}

const ALERTS_KEY = 'antabayqc_conductor_alerts_v1'
const MAX_ALERTS = 50

function readAlerts() {
  try {
    const stored = JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]')
    return Array.isArray(stored) ? stored.filter((alert) => alert && alert.id && alert.title).slice(0, MAX_ALERTS) : []
  } catch {
    return []
  }
}

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    const session = raw ? JSON.parse(raw) : null
    if (session?.firebaseAuthenticated && session.role === 'conductor') return session
    sessionStorage.removeItem(SESSION_KEY)
    return null
  } catch {
    return null
  }
}

export function ConductorProvider({ children }) {
  const [session, setSession] = useState(readSession)
  const [profile, setProfile] = useState(initialProfile) // sample data: edits stay on this device and reset on logout
  const [settings, setSettings] = useState(initialSettings)
  const [sosReport, setSosReport] = useState(null)
  const [passengerTotals, setPassengerTotals] = useState(readPassengerTotals)

  const recordPassengerCrossing = useCallback((direction) => {
    setPassengerTotals((current) => ({
      count: direction === 'entry' ? current.count + 1 : Math.max(0, current.count - 1),
      entries: current.entries + (direction === 'entry' ? 1 : 0),
      exits: current.exits + (direction === 'exit' ? 1 : 0),
    }))
  }, [])

  // Manual correction by the conductor (+1 / −1). Changes the onboard total only; the
  // entry/exit totals stay as the camera counted them.
  const adjustPassengerCount = useCallback((delta) => {
    setPassengerTotals((current) => ({ ...current, count: Math.max(0, current.count + delta) }))
  }, [])

  const setPassengerCount = useCallback((count) => {
    if (!Number.isSafeInteger(count) || count < 0) return false
    setPassengerTotals((current) => ({ ...current, count }))
    return true
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(PASSENGER_COUNT_KEY, JSON.stringify(passengerTotals))
    } catch (error) {
      console.error('Could not save conductor passenger count in this browser:', error)
    }
  }, [passengerTotals])

  const login = useCallback((identifier, authDetails = {}) => {
    const next = { identifier, role: 'conductor', ...authDetails, at: Date.now() }
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
    } catch {
      /* ignore storage errors */
    }
    setSession(next)
    if (authDetails.firebaseAuthenticated) {
      setProfile((current) => ({
        ...current,
        fullName: authDetails.displayName || identifier,
        email: authDetails.email || identifier,
        contact: authDetails.phone || '',
      }))
    }
  }, [])

  // Alerts raised on this phone (bus full, camera lost, trip started, SOS sent…). Newest first.
  const [alerts, setAlerts] = useState(readAlerts)
  useEffect(() => {
    try {
      localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts))
    } catch (error) {
      console.error('Could not save conductor alerts in this browser:', error)
    }
  }, [alerts])
  const addAlert = useCallback(({ category = 'system', tone = 'info', title, body = '' }) => {
    const at = Date.now()
    setAlerts((current) => [
      { id: `${at}-${Math.random().toString(36).slice(2, 7)}`, category, tone, title, body, at, read: false },
      ...current,
    ].slice(0, MAX_ALERTS))
  }, [])
  const markAlertsRead = useCallback(() => {
    setAlerts((current) => (current.some((alert) => !alert.read) ? current.map((alert) => ({ ...alert, read: true })) : current))
  }, [])
  const clearAlerts = useCallback(() => setAlerts([]), [])

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    setSession(null)
    setSettings(initialSettings)
    setProfile(initialProfile)
    setSosReport(null)
    // The next person to sign in on this phone starts from zero, not with the last shift's count.
    setPassengerTotals({ count: 0, entries: 0, exits: 0 })
    setAlerts([])
  }, [])

  const updateProfile = useCallback((patch) => setProfile((p) => ({ ...p, ...patch })), [])

  const updateSetting = useCallback((group, key, value) => {
    setSettings((s) => ({ ...s, [group]: { ...s[group], [key]: value } }))
  }, [])

  const resetSettings = useCallback(() => setSettings(initialSettings), [])

  const value = {
    session, login, logout,
    profile, updateProfile,
    settings, updateSetting, resetSettings,
    sosReport, setSosReport,
    passengerCount: passengerTotals.count,
    passengerEntries: passengerTotals.entries,
    passengerExits: passengerTotals.exits,
    recordPassengerCrossing,
    setPassengerCount,
    adjustPassengerCount,
    alerts, addAlert, markAlertsRead, clearAlerts,
    unreadAlerts: alerts.filter((alert) => !alert.read).length,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useConductor() {
  return useContext(Ctx)
}
