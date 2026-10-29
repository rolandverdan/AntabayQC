import { createContext, useCallback, useContext, useState } from 'react'
import { initialProfile, initialSettings } from '../data/mock.js'

// MOCK AUTH ONLY. A flag in browser storage is not security; anyone can edit it in dev tools.
// Profile, settings and SOS reports live in React state only (reset on refresh / logout).
const SESSION_KEY = 'antabayqc_conductor_session'
const Ctx = createContext(null)

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function ConductorProvider({ children }) {
  const [session, setSession] = useState(readSession)
  const profile = initialProfile // read-only: only the administrator can change conductor details
  const [settings, setSettings] = useState(initialSettings)
  const [sosReport, setSosReport] = useState(null)

  const login = useCallback((identifier) => {
    const next = { identifier, at: Date.now() }
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
    } catch {
      /* ignore storage errors */
    }
    setSession(next)
  }, [])

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    setSession(null)
    setSettings(initialSettings)
    setSosReport(null)
  }, [])

  const updateSetting = useCallback((group, key, value) => {
    setSettings((s) => ({ ...s, [group]: { ...s[group], [key]: value } }))
  }, [])

  const resetSettings = useCallback(() => setSettings(initialSettings), [])

  const value = {
    session, login, logout,
    profile,
    settings, updateSetting, resetSettings,
    sosReport, setSosReport,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useConductor() {
  return useContext(Ctx)
}
