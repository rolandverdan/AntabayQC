import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from './firebase.js'
import { ensureUserProfile } from './userProfiles.js'

const googleProvider = new GoogleAuthProvider()

export async function signInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password)
  const profile = await ensureUserProfile(result.user)
  return { user: result.user, profile, role: profile.role }
}

export async function registerWithEmail({ name, email, phone, password }) {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password)
  await updateProfile(result.user, { displayName: name.trim() })
  await ensureUserProfile(result.user, { name, phone })
  return result.user
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider)
  const profile = await ensureUserProfile(result.user)
  return { user: result.user, profile, role: profile.role }
}

export function signOutFirebaseUser() {
  return signOut(auth)
}

export function getAuthErrorMessage(error, action = 'sign in') {
  if (error?.code === 'not-found') {
    return 'Firebase Authentication succeeded, but Firestore could not find the (default) database in project antabayqc. Create or enable the Firestore database in the antabayqc Firebase project, then try again.'
  }

  switch (error?.code) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in.'
    case 'auth/weak-password':
      return 'Choose a stronger password.'
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'No matching email/password account was found, or the password is incorrect. A Firestore role document alone does not create login credentials; add the user in Firebase Authentication and enable Email/Password sign-in. If the account uses Google, choose Continue with Google.'
    case 'permission-denied':
      return 'Firebase Authentication succeeded, but Firestore denied access to the user profile. Publish the project Firestore rules and confirm they allow the signed-in user to read their own users/{uid} document.'
    case 'auth/user-disabled':
      return 'This Firebase Authentication account has been disabled.'
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Wait a bit and try again.'
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.'
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in window. Allow pop-ups and try again.'
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in Firebase Authentication.'
    case 'auth/network-request-failed':
      return 'Could not reach Firebase. Check your internet connection and try again.'
    default:
      return `Could not ${action}. Please try again.`
  }
}
