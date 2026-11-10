const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { FieldValue, getFirestore } = require('firebase-admin/firestore')
const { HttpsError, onCall } = require('firebase-functions/v2/https')

initializeApp()

const auth = getAuth()
const db = getFirestore()

async function requireAdmin(request) {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in as an administrator.')

  const profile = await db.doc(`users/${uid}`).get()
  if (!profile.exists || profile.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'Administrator access is required.')
  }
  return { uid, profile: profile.data() }
}

function validateAccount(account) {
  if (!account || account.type !== 'Conductor' || !/^[A-Za-z0-9_-]+$/.test(account.id || '') || !/^EMP-C-\d{3,}$/.test(account.employeeId || '')) {
    throw new HttpsError('invalid-argument', 'A valid conductor account is required.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.username || '')) {
    throw new HttpsError('invalid-argument', 'Enter a valid email address.')
  }
  if (!account.fullName || !account.contact || !['Active', 'Inactive'].includes(account.status)) {
    throw new HttpsError('invalid-argument', 'Name and contact number are required.')
  }
}

async function restoreAuthUser(uid, previousUser, label) {
  try {
    await auth.updateUser(uid, {
      email: previousUser.email,
      displayName: previousUser.displayName || null,
      disabled: previousUser.disabled,
    })
  } catch (error) {
    console.error(`Could not restore ${label} after a Firestore write failed:`, error)
    throw new HttpsError('internal', `${label} could not be saved and the sign-in account could not be restored. Contact the project administrator.`)
  }
}

async function ensureEmailAvailable(email, accountId) {
  const matches = await db.collection('accounts').where('username', '==', email).get()
  if (matches.docs.some((item) => item.id !== accountId)) {
    throw new HttpsError('already-exists', 'That email is already assigned to another staff account.')
  }
}

async function assignConductor(batch, accountId, busId) {
  const buses = await db.collection('buses').get()
  for (const bus of buses.docs) {
    const assigned = bus.data().conductorId
    const shouldAssign = bus.id === busId
    if ((assigned === accountId && !shouldAssign) || (shouldAssign && assigned !== accountId)) {
      batch.set(bus.ref, {
        conductorId: shouldAssign ? accountId : '',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
    }
  }
}

function addLog(batch, admin, action, description, severity = 'Info') {
  const ref = db.collection('logs').doc()
  batch.set(ref, {
    action,
    description,
    module: 'Accounts',
    severity,
    user: admin.profile.displayName || admin.profile.email || admin.uid,
    timestamp: FieldValue.serverTimestamp(),
  })
}

exports.createConductorAccount = onCall(async (request) => {
  const admin = await requireAdmin(request)
  const { account, busId = '', password } = request.data || {}
  validateAccount(account)
  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpsError('invalid-argument', 'Choose a password with at least 8 characters.')
  }
  await ensureEmailAvailable(account.username.trim().toLowerCase(), account.id)

  const existing = await db.doc(`accounts/${account.id}`).get()
  if (existing.exists) throw new HttpsError('already-exists', 'That employee account already exists.')

  let createdUser
  try {
    createdUser = await auth.createUser({
      email: account.username.trim().toLowerCase(),
      password,
      displayName: account.fullName,
      disabled: account.status === 'Inactive',
    })

    const batch = db.batch()
    const createdAt = FieldValue.serverTimestamp()
    batch.set(db.doc(`users/${createdUser.uid}`), {
      displayName: account.fullName,
      email: account.username.trim().toLowerCase(),
      phone: account.contact,
      role: 'conductor',
      staffType: 'Conductor',
      employeeId: account.employeeId,
      status: account.status,
      createdAt,
      updatedAt: createdAt,
    })
    batch.set(db.doc(`accounts/${account.id}`), {
      ...account,
      username: account.username.trim().toLowerCase(),
      uid: createdUser.uid,
      ...(account.avatar ? {} : { avatar: '' }),
      createdAt,
      updatedAt: createdAt,
    })
    await assignConductor(batch, account.id, account.status === 'Active' ? busId : '')
    addLog(batch, admin, 'Conductor account created', `Account ${account.id} (${account.fullName}) created.`, 'Success')
    await batch.commit()
  } catch (error) {
    if (createdUser) {
      try {
        await auth.deleteUser(createdUser.uid)
      } catch (cleanupError) {
        console.error('Could not roll back the new conductor user:', cleanupError)
        throw new HttpsError('internal', 'The account could not be saved and cleanup failed. Contact the project administrator.')
      }
    }
    if (error instanceof HttpsError) throw error
    console.error('Could not provision conductor account:', error)
    throw new HttpsError('internal', 'The conductor account could not be created. Please retry.')
  }

  return { uid: createdUser.uid }
})

exports.updateConductorAccount = onCall(async (request) => {
  const admin = await requireAdmin(request)
  const { account, busId = '' } = request.data || {}
  validateAccount(account)

  const accountRef = db.doc(`accounts/${account.id}`)
  const existing = await accountRef.get()
  if (!existing.exists || existing.data().type !== 'Conductor' || !existing.data().uid) {
    throw new HttpsError('not-found', 'The conductor account was not found.')
  }
  await ensureEmailAvailable(account.username.trim().toLowerCase(), account.id)

  const uid = existing.data().uid
  const previousUser = await auth.getUser(uid)
  let authUpdated = false
  try {
    await auth.updateUser(uid, {
      email: account.username.trim().toLowerCase(),
      displayName: account.fullName,
      disabled: account.status === 'Inactive',
    })
    authUpdated = true
    const batch = db.batch()
    batch.set(accountRef, {
      ...account,
      username: account.username.trim().toLowerCase(),
      uid,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
    batch.set(db.doc(`users/${uid}`), {
      displayName: account.fullName,
      email: account.username.trim().toLowerCase(),
      phone: account.contact,
      role: 'conductor',
      staffType: 'Conductor',
      employeeId: account.employeeId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
    await assignConductor(batch, account.id, account.status === 'Active' ? busId : '')
    addLog(batch, admin, 'Conductor account updated', `Account ${account.id} (${account.fullName}) updated.`)
    await batch.commit()
  } catch (error) {
    if (authUpdated) await restoreAuthUser(uid, previousUser, 'The conductor account')
    if (error instanceof HttpsError) throw error
    console.error('Could not update conductor account:', error)
    throw new HttpsError('internal', 'The conductor account could not be updated. Please retry.')
  }

  return { uid }
})

exports.setConductorAccountStatus = onCall(async (request) => {
  const admin = await requireAdmin(request)
  const { id, status } = request.data || {}
  if (!id || !['Active', 'Inactive'].includes(status)) {
    throw new HttpsError('invalid-argument', 'A valid account and status are required.')
  }

  const accountRef = db.doc(`accounts/${id}`)
  const snapshot = await accountRef.get()
  if (!snapshot.exists || snapshot.data().type !== 'Conductor' || !snapshot.data().uid) {
    throw new HttpsError('not-found', 'The conductor account was not found.')
  }
  const account = snapshot.data()

  const previousUser = await auth.getUser(account.uid)
  let authUpdated = false
  try {
    await auth.updateUser(account.uid, { disabled: status === 'Inactive' })
    authUpdated = true
    const batch = db.batch()
    batch.set(accountRef, { status, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    batch.set(db.doc(`users/${account.uid}`), { status, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    if (status === 'Inactive') await assignConductor(batch, id, '')
    addLog(batch, admin, `Conductor account ${status === 'Inactive' ? 'deactivated' : 'reactivated'}`, `Account ${id} (${account.fullName}) set to ${status}.`, status === 'Inactive' ? 'Warning' : 'Success')
    await batch.commit()
  } catch (error) {
    if (authUpdated) await restoreAuthUser(account.uid, previousUser, 'The conductor account status')
    if (error instanceof HttpsError) throw error
    console.error('Could not change conductor account status:', error)
    throw new HttpsError('internal', 'The conductor account status could not be changed.')
  }
})

exports.resetConductorPassword = onCall(async (request) => {
  const admin = await requireAdmin(request)
  const { uid, password } = request.data || {}
  if (!uid || typeof password !== 'string' || password.length < 8) {
    throw new HttpsError('invalid-argument', 'A conductor and a password of at least 8 characters are required.')
  }
  const matches = await db.collection('accounts').where('uid', '==', uid).limit(1).get()
  if (matches.empty || matches.docs[0].data().type !== 'Conductor') {
    throw new HttpsError('not-found', 'The conductor account was not found.')
  }
  await auth.updateUser(uid, { password })
  const account = matches.docs[0].data()
  const batch = db.batch()
  addLog(batch, admin, 'Conductor password reset', `Password reset for ${account.fullName} (${account.employeeId}).`, 'Warning')
  await batch.commit()
  return { updated: true }
})
