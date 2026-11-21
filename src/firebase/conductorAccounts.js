import { getAuth, createUserWithEmailAndPassword, deleteUser, signOut } from 'firebase/auth'
import { getApps, initializeApp } from 'firebase/app'
import { collection, doc, getFirestore, serverTimestamp, writeBatch } from 'firebase/firestore'
import { auth, db, firebaseConfig } from './firebase.js'

const SECONDARY_APP_NAME = 'antabayqc-conductor-provisioner'

function getProvisioningAuth() {
  const secondaryApp = getApps().find((item) => item.name === SECONDARY_APP_NAME)
    || initializeApp(firebaseConfig, SECONDARY_APP_NAME)
  return getAuth(secondaryApp)
}

export async function createConductorAccountClient({ account, busId = '', password, buses, adminName }) {
  if (!auth.currentUser) throw new Error('Sign in as an administrator before creating a conductor account.')

  const provisioningAuth = getProvisioningAuth()
  if (provisioningAuth.currentUser) await signOut(provisioningAuth)

  const email = account.username.trim().toLowerCase()
  const credential = await createUserWithEmailAndPassword(provisioningAuth, email, password)
  const batch = writeBatch(db)
  const timestamp = serverTimestamp()

  batch.set(doc(db, 'users', credential.user.uid), {
    displayName: account.fullName,
    email,
    phone: account.contact,
    role: 'conductor',
    staffType: 'Conductor',
    employeeId: account.employeeId,
    status: account.status,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  batch.set(doc(db, 'accounts', account.id), {
    ...account,
    username: email,
    uid: credential.user.uid,
    avatar: account.avatar || '',
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  const assignedBusId = account.status === 'Active' ? busId : ''
  for (const bus of buses) {
    const shouldAssign = bus.id === assignedBusId
    if ((bus.conductorId === account.id && !shouldAssign) || (shouldAssign && bus.conductorId !== account.id)) {
      batch.set(doc(db, 'buses', bus.id), {
        conductorId: shouldAssign ? account.id : '',
        updatedAt: timestamp,
      }, { merge: true })
    }
  }

  batch.set(doc(collection(db, 'logs')), {
    action: 'Conductor account created',
    description: `Account ${account.id} (${account.fullName}) created.`,
    module: 'Accounts',
    severity: 'Success',
    user: adminName || 'Administrator',
    timestamp,
  })

  try {
    await batch.commit()
  } catch (error) {
    try {
      await deleteUser(credential.user)
    } catch (cleanupError) {
      console.error('Could not remove the new sign-in account after its Firestore write failed:', cleanupError)
      throw new Error('The conductor profile could not be saved, and its sign-in account could not be removed. Contact the Firebase project owner.')
    } finally {
      await signOut(provisioningAuth).catch(() => {})
    }
    throw error
  }

  await signOut(provisioningAuth)
  return { uid: credential.user.uid }
}
