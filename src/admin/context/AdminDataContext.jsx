import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { seedData, defaultSettings } from '../data/mockData.js'
import { nextId } from '../utils/format.js'

// Browser storage only: this is NOT a database and offers no security.
const STORAGE_KEY = 'antabayqc_admin_v4'
const Ctx = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      if (p && Array.isArray(p.buses) && Array.isArray(p.routes) && Array.isArray(p.stops)) {
        return { ...seedData(), ...p, settings: { ...defaultSettings, ...p.settings } }
      }
    }
  } catch {
    /* fall through to seed data */
  }
  return seedData()
}

/** Adds a frontend-generated log entry to a db snapshot. */
function withLog(db, { action, module, description, severity = 'Info' }) {
  const entry = {
    id: nextId('LOG', db.logs, 4),
    timestamp: new Date().toISOString(),
    action,
    user: db.settings.name,
    module,
    description,
    severity,
  }
  return { ...db, logs: [entry, ...db.logs] }
}

const staffField = (type) => (type === 'Driver' ? 'driverId' : 'conductorId')

export function AdminDataProvider({ children }) {
  const [db, setDb] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    } catch {
      /* storage full / unavailable: keep working in memory */
    }
  }, [db])

  const actions = {
    addLog: (entry) => setDb((p) => withLog(p, entry)),

    // ---------- Accounts ----------
    saveAccount: (acc, busId) =>
      setDb((p) => {
        const isNew = !acc.id
        const id = acc.id || nextId('ACC', p.accounts, 3)
        const record = { ...acc, id, createdAt: acc.createdAt || new Date().toISOString() }
        const accounts = isNew ? [...p.accounts, record] : p.accounts.map((a) => (a.id === id ? record : a))
        const field = staffField(record.type)
        const assignTo = record.status === 'Active' ? busId : ''
        const buses = p.buses.map((b) => {
          let nb = b
          if (b[field] === id && b.id !== assignTo) nb = { ...nb, [field]: '' }
          if (b.id === assignTo) nb = { ...nb, [field]: id }
          return nb
        })
        return withLog({ ...p, accounts, buses }, {
          action: `${record.type} account ${isNew ? 'created' : 'updated'}`,
          module: 'Accounts',
          severity: isNew ? 'Success' : 'Info',
          description: `Account ${id} (${record.fullName}) ${isNew ? 'created' : 'updated'}.`,
        })
      }),

    setAccountStatus: (id, status) =>
      setDb((p) => {
        const acc = p.accounts.find((a) => a.id === id)
        if (!acc) return p
        const buses =
          status === 'Inactive'
            ? p.buses.map((b) => ({
                ...b,
                driverId: b.driverId === id ? '' : b.driverId,
                conductorId: b.conductorId === id ? '' : b.conductorId,
              }))
            : p.buses
        return withLog(
          { ...p, buses, accounts: p.accounts.map((a) => (a.id === id ? { ...a, status } : a)) },
          {
            action: `${acc.type} account ${status === 'Inactive' ? 'deactivated' : 'reactivated'}`,
            module: 'Accounts',
            severity: status === 'Inactive' ? 'Warning' : 'Success',
            description: `Account ${id} (${acc.fullName}) set to ${status}.`,
          },
        )
      }),

    // ---------- Buses ----------
    saveBus: (bus) =>
      setDb((p) => {
        const exists = p.buses.some((b) => b.id === bus.id)
        let buses = exists
          ? p.buses.map((b) => (b.id === bus.id ? { ...b, ...bus } : b))
          : [...p.buses, { passengers: 0, speed: bus.status === 'Active' ? 20 : 0, progress: 0, createdAt: new Date().toISOString(), ...bus }]
        // a driver / conductor can only be assigned to one bus
        buses = buses.map((b) =>
          b.id === bus.id
            ? b
            : {
                ...b,
                driverId: bus.driverId && b.driverId === bus.driverId ? '' : b.driverId,
                conductorId: bus.conductorId && b.conductorId === bus.conductorId ? '' : b.conductorId,
              },
        )
        return withLog({ ...p, buses }, {
          action: exists ? 'Bus information updated' : 'Bus added',
          module: 'Buses',
          severity: exists ? 'Info' : 'Success',
          description: `${bus.id} (${bus.plate}) ${exists ? 'updated' : 'added to the fleet'}.`,
        })
      }),

    setBusStatus: (id, status) =>
      setDb((p) =>
        withLog(
          {
            ...p,
            buses: p.buses.map((b) => (b.id === id ? { ...b, status, speed: status === 'Active' ? b.speed || 20 : 0 } : b)),
          },
          {
            action: status === 'Inactive' ? 'Bus deactivated' : 'Bus status changed',
            module: 'Buses',
            severity: status === 'Active' ? 'Success' : 'Warning',
            description: `${id} set to ${status}.`,
          },
        ),
      ),

    // ---------- Bus stops ----------
    saveStop: (stop, routeIds) =>
      setDb((p) => {
        const exists = p.stops.some((s) => s.id === stop.id)
        const stops = exists ? p.stops.map((s) => (s.id === stop.id ? stop : s)) : [...p.stops, stop]
        const routes = p.routes.map((r) => {
          const has = r.stopIds.includes(stop.id)
          const want = routeIds.includes(r.id)
          if (want && !has) return { ...r, stopIds: [...r.stopIds, stop.id] }
          if (!want && has) return { ...r, stopIds: r.stopIds.filter((x) => x !== stop.id) }
          return r
        })
        return withLog({ ...p, stops, routes }, {
          action: exists ? 'Bus stop edited' : 'Bus stop added',
          module: 'Bus Stops',
          severity: exists ? 'Info' : 'Success',
          description: `${stop.id} ${stop.name} ${exists ? 'updated' : 'added'}.`,
        })
      }),

    deleteStop: (id) =>
      setDb((p) => {
        const stop = p.stops.find((s) => s.id === id)
        return withLog({ ...p, stops: p.stops.filter((s) => s.id !== id) }, {
          action: 'Bus stop deleted',
          module: 'Bus Stops',
          severity: 'Warning',
          description: `${id} ${stop?.name || ''} deleted.`,
        })
      }),

    // ---------- Routes ----------
    saveRoute: (route, busIds) =>
      setDb((p) => {
        const exists = p.routes.some((r) => r.id === route.id)
        const routes = exists ? p.routes.map((r) => (r.id === route.id ? route : r)) : [...p.routes, route]
        const buses = p.buses.map((b) => {
          if (busIds.includes(b.id)) return { ...b, routeId: route.id }
          if (b.routeId === route.id) return { ...b, routeId: '' }
          return b
        })
        return withLog({ ...p, routes, buses }, {
          action: exists ? 'Route modified' : 'Route added',
          module: 'Routes',
          severity: exists ? 'Info' : 'Success',
          description: `${route.id} ${route.name} ${exists ? 'modified' : 'created'}.`,
        })
      }),

    setRouteStatus: (id, status) =>
      setDb((p) =>
        withLog({ ...p, routes: p.routes.map((r) => (r.id === id ? { ...r, status } : r)) }, {
          action: status === 'Inactive' ? 'Route deactivated' : 'Route reactivated',
          module: 'Routes',
          severity: status === 'Inactive' ? 'Warning' : 'Success',
          description: `${id} set to ${status}.`,
        }),
      ),

    // ---------- Reports / emergencies ----------
    updateReportStatus: (id, status) =>
      setDb((p) =>
        withLog({ ...p, reports: p.reports.map((r) => (r.id === id ? { ...r, status } : r)) }, {
          action: 'Report status updated',
          module: 'Reports',
          severity: status === 'Resolved' ? 'Success' : 'Info',
          description: `${id} moved to ${status}.`,
        }),
      ),

    updateEmergencyStatus: (id, status) =>
      setDb((p) =>
        withLog(
          {
            ...p,
            emergencies: p.emergencies.map((e) =>
              e.id === id
                ? { ...e, status, history: [...(e.history || []), { status, at: new Date().toISOString(), by: p.settings.name }] }
                : e,
            ),
          },
          {
            action: 'Emergency status updated',
            module: 'Emergencies',
            severity: status === 'Resolved' ? 'Success' : 'Warning',
            description: `${id} moved to ${status}.`,
          },
        ),
      ),

    // ---------- Settings / reset ----------
    saveSettings: (settings) =>
      setDb((p) =>
        withLog({ ...p, settings: { ...p.settings, ...settings } }, {
          action: 'Settings changed',
          module: 'Settings',
          description: 'Administrator profile / preferences updated.',
        }),
      ),

    resetData: () => setDb(seedData()),
  }

  const lookup = useMemo(
    () => ({
      stopsById: Object.fromEntries(db.stops.map((s) => [s.id, s])),
      routesById: Object.fromEntries(db.routes.map((r) => [r.id, r])),
      accountsById: Object.fromEntries(db.accounts.map((a) => [a.id, a])),
      busesById: Object.fromEntries(db.buses.map((b) => [b.id, b])),
    }),
    [db.stops, db.routes, db.accounts, db.buses],
  )

  return <Ctx.Provider value={{ ...db, ...lookup, ...actions }}>{children}</Ctx.Provider>
}

export function useAdminData() {
  return useContext(Ctx)
}
