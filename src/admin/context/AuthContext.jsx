import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase/firebase.js'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return
      setReady(false)
      setError('')
      if (!firebaseUser) {
        setUser(null)
        setReady(true)
        return
      }

      try {
        const snapshot = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (!active) return
        const profile = snapshot.exists() ? snapshot.data() : null
        if (profile?.role === 'admin') {
          setUser({
            uid: firebaseUser.uid,
            identifier: firebaseUser.email || firebaseUser.uid,
            email: profile.email || firebaseUser.email || '',
            displayName: profile.displayName || firebaseUser.displayName || '',
            phone: profile.phone || '',
            role: 'admin',
            firebaseAuthenticated: true,
          })
        } else {
          setUser(null)
        }
      } catch (loadError) {
        if (active) {
          console.error('Could not verify the administrator profile:', loadError)
          setError(loadError.message || 'Could not verify your administrator account.')
          setUser(null)
        }
      } finally {
        if (active) setReady(true)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const login = (identifier, _remember, authDetails = {}) => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser || !authDetails.firebaseAuthenticated || firebaseUser.uid !== authDetails.uid || authDetails.role !== 'admin') {
      throw new Error('A verified Firebase administrator account is required.')
    }
    setUser({
      identifier,
      ...authDetails,
      role: 'admin',
      firebaseAuthenticated: true,
    })
  }

  const logout = () => setUser(null)
  const updateProfile = (changes) => setUser((current) => current && ({ ...current, ...changes }))

  return <Ctx.Provider value={{ user, ready, error, login, logout, updateProfile }}>{children}</Ctx.Provider>
}

export function useAuth() {
  return useContext(Ctx)
}
