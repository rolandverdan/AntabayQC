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
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useConductor() {
  return useContext(Ctx)
}
