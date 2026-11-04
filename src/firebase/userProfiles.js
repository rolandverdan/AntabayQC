import { doc, onSnapshot, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { auth, db } from './firebase.js'

export const USER_ROLES = ['commuter', 'conductor', 'admin']

export function getUserRole(role) {
  return USER_ROLES.includes(role) ? role : 'commuter'
}

export function watchUserProfile(uid, onProfile, onError) {
  return onSnapshot(doc(db, 'users', uid), (snapshot) => {
    onProfile(snapshot.exists() ? snapshot.data() : null)
  }, onError)
}

export async function ensureUserProfile(user, { name, phone } = {}) {
  const profileRef = doc(db, 'users', user.uid)
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(profileRef)
    const existing = snapshot.exists() ? snapshot.data() : null
    const profile = {
      displayName: name?.trim() || existing?.displayName || user.displayName || user.email || 'Commuter',
      email: user.email || '',
      updatedAt: serverTimestamp(),
    }

    if (phone !== undefined) profile.phone = phone.trim()
    else if (existing?.phone !== undefined) profile.phone = existing.phone

    if (existing) {
      transaction.update(profileRef, profile)
      return { ...existing, ...profile, role: getUserRole(existing.role) }
    }

    const newProfile = {
      ...profile,
      role: 'commuter',
      phone: phone?.trim() || '',
      createdAt: serverTimestamp(),
    }
    transaction.set(profileRef, newProfile)
    return newProfile
  })
}

export async function updateUserProfile(uid, { displayName, phone }) {
  const updates = { updatedAt: serverTimestamp() }
  if (displayName !== undefined) updates.displayName = displayName.trim()
  if (phone !== undefined) updates.phone = phone.trim()

  await updateDoc(doc(db, 'users', uid), updates)

  if (auth.currentUser?.uid === uid && displayName !== undefined) {
    await updateProfile(auth.currentUser, { displayName: displayName.trim() })
  }
}
