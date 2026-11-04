import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../firebase/firebase.js'
import { signOutFirebaseUser } from '../../firebase/auth.js'
import { ensureUserProfile, getUserRole, watchUserProfile } from '../../firebase/userProfiles.js'
import { saveCommuterProfile } from '../data/accounts.js'

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
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    let stopProfile = null
    const stopAuth = onAuthStateChanged(
      auth,
      (user) => {
        stopProfile?.()
        stopProfile = null
        const current = readSession()
        if (!user) {
          setUserProfile(null)
          if (current?.firebaseAuthenticated) {
            try {
              sessionStorage.removeItem(SESSION_KEY)
            } catch {
              /* The auth state still updates if browser storage is unavailable. */
            }
            setSession(null)
          }
          return
        }

        stopProfile = watchUserProfile(
          user.uid,
          (profile) => {
            if (!profile) {
              ensureUserProfile(user).catch((error) => console.error('Could not create Firebase user profile:', error))
              return
            }
            const role = getUserRole(profile.role)
            const activeProfile = {
              uid: user.uid,
              role,
              displayName: profile.displayName || user.displayName || '',
              email: profile.email || user.email || '',
              phone: profile.phone || '',
              photoURL: user.photoURL || '',
            }
            setUserProfile(activeProfile)
            saveCommuterProfile({
              name: activeProfile.displayName || activeProfile.email || 'Commuter',
              email: activeProfile.email,
              phone: activeProfile.phone,
            })
            if (role !== 'commuter') {
              if (current?.firebaseAuthenticated) {
                try {
                  sessionStorage.removeItem(SESSION_KEY)
                } catch {
                  /* The profile role still determines the active app if storage is unavailable. */
                }
              }
              setSession((active) => active?.firebaseAuthenticated ? null : active)
              return
            }
            const next = {
              mode: 'account',
              identifier: user.email || user.uid,
              uid: user.uid,
              role,
              firebaseAuthenticated: true,
              at: Date.now(),
            }
            try {
              sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
            } catch {
              /* Firebase remains the source of truth if browser storage is unavailable. */
            }
            setSession(next)
          },
          (error) => console.error('Firebase user profile listener failed:', error),
        )
      },
      (error) => console.error('Firebase auth state listener failed:', error),
    )
    return () => {
      stopAuth()
      stopProfile?.()
    }
  }, [])

  // mode: 'guest' | 'account'
  const enter = useCallback((mode, identifier = '', firebaseAuthenticated = false, role = 'commuter') => {
    const next = { mode, identifier, role, firebaseAuthenticated, at: Date.now() }
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
    } catch {
      /* ignore storage errors */
    }
    setSession(next)
  }, [])

  const leave = useCallback(async () => {
    await signOutFirebaseUser()
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    setSession(null)
  }, [])

  const clearSession = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* Keep the in-memory session consistent if storage is unavailable. */
    }
    setSession(null)
  }, [])

  return <Ctx.Provider value={{ session, userProfile, enter, leave, clearSession }}>{children}</Ctx.Provider>
}

export function useCommuter() {
  return useContext(Ctx)
}
