import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { auth, db } from '../../firebase/firebase.js'
import {
  createConductorAccount,
  resetConductorPassword as resetConductorPasswordFunction,
  setConductorAccountStatus as setConductorAccountStatusFunction,
  updateConductorAccount,
} from '../../firebase/functions.js'
import { useAuth } from './AuthContext.jsx'

const Ctx = createContext(null)
const COLLECTIONS = ['buses', 'routes', 'stops', 'accounts', 'logs', 'reports', 'emergencies', 'busLocations']
const PUBLIC_COLLECTIONS = new Set(['buses', 'routes', 'stops'])
const EMPTY_SETTINGS = {
  name: '',
  email: '',
  phone: '',
  role: 'Administrator',
  notifications: { emergency: true, reports: true, logs: false },
  showMapPreview: true,
  showRecentActivity: true,
  pageSize: 8,
  density: 'comfortable',
}

function emptyData() {
  return {
    accounts: [],
    buses: [],
    stops: [],
    routes: [],
    logs: [],
    reports: [],
    emergencies: [],
    busLocations: [],
    settings: { ...EMPTY_SETTINGS, notifications: { ...EMPTY_SETTINGS.notifications } },
  }
}

function serialize(value) {
  if (value?.toDate) return value.toDate().toISOString()
  if (Array.isArray(value)) return value.map(serialize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialize(item)]))
  }
  return value
}

function snapshotRows(snapshot) {
  return snapshot.docs.map((item) => {
    const data = serialize(item.data())
    return { ...data, id: data.id || item.id, docId: item.id }
  })
}

function logRecord(batch, entry, userName) {
  const ref = doc(collection(db, 'logs'))
  batch.set(ref, {
    ...entry,
    user: entry.user || userName || 'Administrator',
    timestamp: serverTimestamp(),
  })
}

function staffField(type) {
  return type === 'Driver' ? 'driverId' : 'conductorId'
}

export function AdminDataProvider({ children }) {
  const { user, ready: authReady } = useAuth()
  const [data, setData] = useState(emptyData)
  const [dataStatus, setDataStatus] = useState('loading')
  const [dataError, setDataError] = useState('')
  const [retry, setRetry] = useState(0)
  const isAdmin = user?.firebaseAuthenticated && user.role === 'admin'

  useEffect(() => {
    if (!authReady) return undefined

    let active = true
    const ready = new Set()
    const collections = isAdmin ? COLLECTIONS : [...PUBLIC_COLLECTIONS]
    const unsubscribers = []

    setData(emptyData())
    setDataError('')
    setDataStatus('loading')

    const fail = (error) => {
      if (!active) return
      console.error('Could not load admin data from Firestore:', error)
      setDataError(error.message || 'The database could not be reached.')
      setDataStatus('error')
    }

    for (const name of collections) {
      unsubscribers.push(onSnapshot(collection(db, name), (snapshot) => {
        if (!active) return
        setData((current) => ({ ...current, [name]: snapshotRows(snapshot) }))
        ready.add(name)
        if (ready.size === collections.length && (!isAdmin || ready.has('adminSettings'))) setDataStatus('ready')
      }, fail))
    }

    if (isAdmin) {
      unsubscribers.push(onSnapshot(doc(db, 'adminSettings', 'preferences'), (snapshot) => {
        if (!active) return
        const saved = snapshot.exists() ? serialize(snapshot.data()) : {}
        setData((current) => ({
          ...current,
          settings: {
            ...EMPTY_SETTINGS,
            ...saved,
            notifications: { ...EMPTY_SETTINGS.notifications, ...saved.notifications },
          },
        }))
        ready.add('adminSettings')
        if (ready.size === collections.length + 1) setDataStatus('ready')
      }, fail))
    }

    return () => {
      active = false
      unsubscribers.forEach((unsubscribe) => unsubscribe())
    }
  }, [authReady, isAdmin, retry])

  const addLog = useCallback(async (entry) => {
    const name = user?.displayName || user?.identifier
    await addDoc(collection(db, 'logs'), {
      ...entry,
      user: entry.user || name || 'Administrator',
      timestamp: serverTimestamp(),
    })
  }, [user])

  const addReport = useCallback(async (report) => {
    if (!auth.currentUser) throw new Error('Sign in before submitting a report.')
    const reportRef = doc(collection(db, 'reports'))
    const record = {
      status: 'Pending',
      priority: 'Medium',
      busId: '',
      routeId: '',
      reportedBy: 'Passenger',
      source: 'Commuter',
      ...report,
      id: reportRef.id,
      createdBy: auth.currentUser.uid,
      datetime: new Date().toISOString(),
      createdAt: serverTimestamp(),
    }
    await setDoc(reportRef, record)
    return record.id
  }, [])

  const saveAccount = useCallback(async (account, busId, password) => {
    const batch = writeBatch(db)
    const id = account.id
    if (!id) throw new Error('An account ID is required.')
    const isNew = !data.accounts.some((item) => item.id === id)

    if (account.type === 'Conductor') {
      const request = {
        account: { ...account, id },
        busId: busId || '',
      }
      if (isNew) request.password = password
      await (isNew ? createConductorAccount : updateConductorAccount)(request)
      return
    }

    const record = { ...account, id, updatedAt: serverTimestamp() }
    if (isNew) record.createdAt = serverTimestamp()
    batch.set(doc(db, 'accounts', id), record, { merge: true })

    const field = staffField(account.type)
    const assignTo = account.status === 'Active' ? busId : ''
    for (const bus of data.buses) {
      const next = { ...bus }
      let changed = false
      if (bus[field] === id && bus.id !== assignTo) {
        next[field] = ''
        changed = true
      }
      if (bus.id === assignTo && assignTo) {
        next[field] = id
        changed = true
      }
      if (changed) batch.set(doc(db, 'buses', bus.id), { ...next, updatedAt: serverTimestamp() }, { merge: true })
    }
    logRecord(batch, {
      action: `Driver account ${isNew ? 'created' : 'updated'}`,
      module: 'Accounts',
      severity: isNew ? 'Success' : 'Info',
      description: `Account ${id} (${account.fullName}) ${isNew ? 'created' : 'updated'}.`,
    }, user?.displayName || user?.identifier)
    await batch.commit()
  }, [data.accounts, data.buses, user])

  const setAccountStatus = useCallback(async (id, status) => {
    const account = data.accounts.find((item) => item.id === id)
    if (!account) throw new Error('The account no longer exists. Refresh and try again.')
    if (account.type === 'Conductor') {
      await setConductorAccountStatusFunction({ id, status })
      return
    }

    const batch = writeBatch(db)
    batch.set(doc(db, 'accounts', id), { status, updatedAt: serverTimestamp() }, { merge: true })
    if (status === 'Inactive') {
      for (const bus of data.buses) {
        if (bus.driverId === id) batch.set(doc(db, 'buses', bus.id), { driverId: '', updatedAt: serverTimestamp() }, { merge: true })
      }
    }
    logRecord(batch, {
      action: `Driver account ${status === 'Inactive' ? 'deactivated' : 'reactivated'}`,
      module: 'Accounts',
      severity: status === 'Inactive' ? 'Warning' : 'Success',
      description: `Account ${id} (${account.fullName}) set to ${status}.`,
    }, user?.displayName || user?.identifier)
    await batch.commit()
  }, [data.accounts, data.buses, user])

  const resetConductorPassword = useCallback(async (uid, password) => {
    await resetConductorPasswordFunction({ uid, password })
  }, [])

  const saveBus = useCallback(async (bus) => {
    const exists = data.buses.some((item) => item.id === bus.id)
    const batch = writeBatch(db)
    batch.set(doc(db, 'buses', bus.id), {
      ...bus,
      updatedAt: serverTimestamp(),
      ...(exists ? {} : { createdAt: serverTimestamp() }),
    }, { merge: true })

    for (const other of data.buses) {
      if (other.id === bus.id) continue
      const next = { ...other }
      let changed = false
      if (bus.driverId && other.driverId === bus.driverId) {
        next.driverId = ''
        changed = true
      }
      if (bus.conductorId && other.conductorId === bus.conductorId) {
        next.conductorId = ''
        changed = true
      }
      if (changed) batch.set(doc(db, 'buses', other.id), { ...next, updatedAt: serverTimestamp() }, { merge: true })
    }
    logRecord(batch, {
      action: exists ? 'Bus information updated' : 'Bus added',
      module: 'Buses',
      severity: exists ? 'Info' : 'Success',
      description: `${bus.id} (${bus.plate}) ${exists ? 'updated' : 'added to the fleet'}.`,
    }, user?.displayName || user?.identifier)
    await batch.commit()
  }, [data.buses, user])

  const setBusStatus = useCallback(async (id, status) => {
    const batch = writeBatch(db)
    batch.set(doc(db, 'buses', id), { status, updatedAt: serverTimestamp() }, { merge: true })
    logRecord(batch, {
      action: status === 'Inactive' ? 'Bus deactivated' : 'Bus status changed',
      module: 'Buses',
      severity: status === 'Active' ? 'Success' : 'Warning',
      description: `${id} set to ${status}.`,
    }, user?.displayName || user?.identifier)
    await batch.commit()
  }, [user])

  const saveStop = useCallback(async (stop, routeIds) => {
    const exists = data.stops.some((item) => item.id === stop.id)
    const batch = writeBatch(db)
    batch.set(doc(db, 'stops', stop.id), {
      ...stop,
      updatedAt: serverTimestamp(),
      ...(exists ? {} : { createdAt: serverTimestamp() }),
    }, { merge: true })
    for (const route of data.routes) {
      const has = route.stopIds.includes(stop.id)
      const wants = routeIds.includes(route.id)
      if (has !== wants) {
        const stopIds = wants ? [...route.stopIds, stop.id] : route.stopIds.filter((id) => id !== stop.id)
        batch.set(doc(db, 'routes', route.id), { stopIds, updatedAt: serverTimestamp() }, { merge: true })
      }
    }
    logRecord(batch, {
      action: exists ? 'Bus stop edited' : 'Bus stop added',
      module: 'Bus Stops',
      severity: exists ? 'Info' : 'Success',
      description: `${stop.id} ${stop.name} ${exists ? 'updated' : 'added'}.`,
    }, user?.displayName || user?.identifier)
    await batch.commit()
  }, [data.routes, data.stops, user])

  const deleteStop = useCallback(async (id) => {
    const stop = data.stops.find((item) => item.id === id)
    const batch = writeBatch(db)
    batch.delete(doc(db, 'stops', id))
    for (const route of data.routes) {
      if (route.stopIds.includes(id)) {
        batch.set(doc(db, 'routes', route.id), {
          stopIds: route.stopIds.filter((stopId) => stopId !== id),
          updatedAt: serverTimestamp(),
        }, { merge: true })
      }
    }
    logRecord(batch, {
      action: 'Bus stop deleted',
      module: 'Bus Stops',
      severity: 'Warning',
      description: `${id} ${stop?.name || ''} deleted.`,
    }, user?.displayName || user?.identifier)
    await batch.commit()
  }, [data.routes, data.stops, user])

  const saveRoute = useCallback(async (route, busIds) => {
    const exists = data.routes.some((item) => item.id === route.id)
    const batch = writeBatch(db)
    batch.set(doc(db, 'routes', route.id), {
      ...route,
      updatedAt: serverTimestamp(),
      ...(exists ? {} : { createdAt: serverTimestamp() }),
    }, { merge: true })
    for (const bus of data.buses) {
      if (busIds.includes(bus.id) && bus.routeId !== route.id) {
        batch.set(doc(db, 'buses', bus.id), { routeId: route.id, updatedAt: serverTimestamp() }, { merge: true })
      } else if (!busIds.includes(bus.id) && bus.routeId === route.id) {
        batch.set(doc(db, 'buses', bus.id), { routeId: '', updatedAt: serverTimestamp() }, { merge: true })
      }
    }
    logRecord(batch, {
      action: exists ? 'Route modified' : 'Route added',
      module: 'Routes',
      severity: exists ? 'Info' : 'Success',
      description: `${route.id} ${route.name} ${exists ? 'modified' : 'created'}.`,
    }, user?.displayName || user?.identifier)
    await batch.commit()
  }, [data.buses, data.routes, user])

  const setRouteStatus = useCallback(async (id, status) => {
    const batch = writeBatch(db)
    batch.set(doc(db, 'routes', id), { status, updatedAt: serverTimestamp() }, { merge: true })
    logRecord(batch, {
      action: status === 'Inactive' ? 'Route deactivated' : 'Route reactivated',
      module: 'Routes',
      severity: status === 'Inactive' ? 'Warning' : 'Success',
      description: `${id} set to ${status}.`,
    }, user?.displayName || user?.identifier)
    await batch.commit()
  }, [user])

  const updateReportStatus = useCallback(async (id, status) => {
    const report = data.reports.find((item) => item.id === id)
    if (!report) throw new Error('The report no longer exists. Refresh and try again.')
    const batch = writeBatch(db)
    batch.set(doc(db, 'reports', report.docId || id), { status, updatedAt: serverTimestamp() }, { merge: true })
    logRecord(batch, {
      action: 'Report status updated',
      module: 'Reports',
      severity: status === 'Resolved' ? 'Success' : 'Info',
      description: `${id} moved to ${status}.`,
    }, user?.displayName || user?.identifier)
    await batch.commit()
  }, [data.reports, user])

  const createEmergency = useCallback(async (emergency) => {
    const emergencyRef = doc(collection(db, 'emergencies'))
    const batch = writeBatch(db)
    const id = emergencyRef.id
    batch.set(emergencyRef, {
      ...emergency,
      reportedBy: user?.displayName || user?.identifier || 'Administrator',
      id,
      datetime: new Date().toISOString(),
      history: [{ status: emergency.status, at: new Date().toISOString(), by: user?.displayName || user?.identifier || 'Administrator' }],
      createdAt: serverTimestamp(),
    })
    logRecord(batch, {
      action: 'Emergency incident recorded',
      module: 'Emergencies',
      severity: emergency.severity === 'Critical' || emergency.severity === 'High' ? 'Warning' : 'Info',
      description: `${id} ${emergency.type} recorded.`,
    }, user?.displayName || user?.identifier)
    await batch.commit()
    return id
  }, [user])

  const updateEmergencyStatus = useCallback(async (id, status) => {
    const emergency = data.emergencies.find((item) => item.id === id)
    if (!emergency) throw new Error('The incident no longer exists. Refresh and try again.')
    const batch = writeBatch(db)
    batch.set(doc(db, 'emergencies', emergency.docId || id), {
      status,
      history: [...(emergency.history || []), {
        status,
        at: new Date().toISOString(),
        by: user?.displayName || user?.identifier || 'Administrator',
      }],
      updatedAt: serverTimestamp(),
    }, { merge: true })
    logRecord(batch, {
      action: 'Emergency status updated',
      module: 'Emergencies',
      severity: status === 'Resolved' ? 'Success' : 'Warning',
      description: `${id} moved to ${status}.`,
    }, user?.displayName || user?.identifier)
    await batch.commit()
  }, [data.emergencies, user])

  const saveSettings = useCallback(async (settings) => {
    const batch = writeBatch(db)
    batch.set(doc(db, 'adminSettings', 'preferences'), {
      notifications: settings.notifications,
      showMapPreview: settings.showMapPreview,
      showRecentActivity: settings.showRecentActivity,
      pageSize: settings.pageSize,
      density: settings.density,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    logRecord(batch, {
      action: 'Settings changed',
      module: 'Settings',
      description: 'Administrator preferences updated.',
    }, settings.name || user?.displayName || user?.identifier)
    await batch.commit()
  }, [user])

  const retryData = useCallback(() => setRetry((value) => value + 1), [])
  const lookup = useMemo(() => ({
    stopsById: Object.fromEntries(data.stops.map((stop) => [stop.id, stop])),
    routesById: Object.fromEntries(data.routes.map((route) => [route.id, route])),
    accountsById: Object.fromEntries(data.accounts.map((account) => [account.id, account])),
    busesById: Object.fromEntries(data.buses.map((bus) => [bus.id, bus])),
    busLocationsById: Object.fromEntries(data.busLocations.map((location) => [location.busId || location.id, location])),
  }), [data.accounts, data.buses, data.busLocations, data.routes, data.stops])

  const value = {
    ...data,
    ...lookup,
    dataStatus,
    dataError,
    retryData,
    addLog,
    addReport,
    saveAccount,
    setAccountStatus,
    resetConductorPassword,
    saveBus,
    setBusStatus,
    saveStop,
    deleteStop,
    saveRoute,
    setRouteStatus,
    updateReportStatus,
    createEmergency,
    updateEmergencyStatus,
    saveSettings,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAdminData() {
  return useContext(Ctx)
}
