import { createContext, useContext, useState } from 'react'

// MOCK AUTH ONLY. A flag in browser storage is not security; anyone can edit it in dev tools.
const SESSION_KEY = 'antabayqc_admin_session'
const Ctx = createContext(null)

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession)

  const login = (identifier, remember) => {
    const session = { identifier, at: Date.now() }
    try {
      ;(remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session))
    } catch {
      /* ignore storage errors */
    }
    setUser(session)
  }

  const logout = () => {
    try {
      localStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    setUser(null)
  }

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  return useContext(Ctx)
}
