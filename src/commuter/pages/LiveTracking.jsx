import { useMemo, useState } from 'react'
import { Search, MapPinned, BusFront, LocateFixed, Clock3, AlertTriangle } from 'lucide-react'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'
import { PageHeader } from '../../admin/components/Card.jsx'

const routeCodeMap = {
  all: 'ALL ACTIVE BUSES',
}

export default function LiveTracking() {
  const { routes, buses } = useAdminData()
  const [query, setQuery] = useState('')
  const [selectedRoute, setSelectedRoute] = useState('all')

  const routeOptions = useMemo(() => {
    const items = routes.map((route) => ({
      id: route.id,
      label: route.id,
      name: route.name,
    }))

    return [{ id: 'all', label: routeCodeMap.all, name: 'All active buses' }, ...items]
  }, [routes])

  const filteredRoutes = useMemo(() => {
    const needle = query.trim().toLowerCase()

    if (!needle) return routeOptions

    return routeOptions.filter((route) => {
      const haystack = `${route.label} ${route.name || ''}`.toLowerCase()
      return haystack.includes(needle)
    })
  }, [query, routeOptions])

  const activeBusCount = buses.filter((bus) => bus.status === 'Active').length
  const delayedBuses = buses.filter((bus) => bus.status === 'Delayed').length
  const averageHeadway = '8 min'

  return (
    <div className="space-y-5">
      <PageHeader
        title="Live Tracking"
        description="See active buses and service updates across QC Bus routes."
        actions={<div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:w-auto sm:min-w-72">
          <Search size={16} aria-hidden="true" className="text-slate-500" />
          <label htmlFor="tracking-search" className="sr-only">Search routes</label>
          <input
            id="tracking-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search route or stop..."
            className="w-full border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
        </div>}
      />

      <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Demo data only. Vehicle locations, headway estimates, and route statuses shown here are not live.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Active buses', value: activeBusCount, icon: BusFront, tone: 'blue' },
          { label: 'Avg headway', value: averageHeadway, icon: Clock3, tone: 'green' },
          { label: 'Delayed', value: delayedBuses, icon: AlertTriangle, tone: 'amber' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-black text-navy">{value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                tone === 'blue' ? 'bg-brand/10 text-brand' :
                tone === 'green' ? 'bg-green-100 text-green-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                <Icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <MapPinned size={12} />
            Select Bus Routes
          </div>
          <p className="text-sm text-slate-500">Choose a route to view live bus movement and stop updates.</p>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter tracking by route">
          {filteredRoutes.length ? filteredRoutes.map((route) => {
            const isSelected = selectedRoute === route.id
            const isAll = route.id === 'all'

            return (
              <button
                key={route.id}
                type="button"
                onClick={() => setSelectedRoute(route.id)}
                aria-pressed={isSelected}
                className={`min-h-11 rounded-xl border px-3 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 ${
                  isSelected
                    ? 'border-brand bg-brand text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-brand/40 hover:text-brand'
                } ${isAll ? 'min-w-[140px]' : ''}`}
              >
                {route.label}
              </button>
            )
          }) : (
            <p role="status" className="w-full rounded-xl border border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-500">
              No routes match “{query}”. Try another search.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[18px] border border-slate-200 bg-white p-0 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-slate-700">
              <BusFront size={16} className="text-brand" />
              {selectedRoute === 'all' ? 'All Active Buses' : selectedRoute}
            </div>

            <div className="text-xs font-medium text-slate-500">
              Demo view
            </div>
          </div>

          <div className="rounded-b-[18px] bg-white p-4">
            <div className="relative h-[60dvh] min-h-[320px] overflow-hidden rounded-[14px] bg-slate-200 md:h-[540px]">
              <p role="status" className="absolute left-4 top-4 max-w-xs rounded-lg bg-white/90 px-3 py-2 text-sm text-slate-600 shadow-sm">
                {activeBusCount ? 'Live bus positions are not available in this demo.' : 'No active buses are available to display right now.'}
              </p>
              <button
                type="button"
                aria-label="Locate me"
                title="Location services are not available in this demo"
                disabled
                className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LocateFixed size={20} />
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-lg font-black text-navy">Route status</h3>
            {[
              { route: 'R-02', status: 'On time', detail: 'Quezon Memorial Circle to Commonwealth', tone: 'green' },
              { route: 'R-03', status: 'Crowded', detail: 'Cubao to Katipunan', tone: 'amber' },
              { route: 'R-01', status: 'Delayed', detail: 'QC Hall to Cubao', tone: 'red' },
            ].map(({ route, status, detail, tone }) => (
              <div key={route} className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 last:mb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-navy">{route}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
                    tone === 'green' ? 'bg-green-100 text-green-700' :
                    tone === 'amber' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>{status}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{detail}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-lg font-black text-navy">Service notes</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">Boarding is busiest between 7:00–9:00 AM.</li>
              <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">Temporary detours are active near Commonwealth Avenue.</li>
              <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">Use the nearest stop marker for turn-by-turn guidance.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
