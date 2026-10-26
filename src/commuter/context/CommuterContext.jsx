import { createContext, useCallback, useContext, useState } from 'react'

// MOCK ACCESS ONLY. A flag in browser storage is not security; anyone can edit it in dev tools.
const SESSION_KEY = 'antabayqc_commuter_session'
const Ctx = createContext(null)

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function CommuterProvider({ children }) {
  const [session, setSession] = useState(readSession)

  // mode: 'guest' | 'account'
  const enter = useCallback((mode, identifier = '') => {
    const next = { mode, identifier, at: Date.now() }
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
    } catch {
      /* ignore storage errors */
    }
    setSession(next)
  }, [])

  const leave = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    setSession(null)
  }, [])

  return <Ctx.Provider value={{ session, enter, leave }}>{children}</Ctx.Provider>
}

export function useCommuter() {
  return useContext(Ctx)
}
