import { useMemo, useState } from 'react'
import { Search, MapPinned, BusFront, Navigation, LocateFixed, Clock3, AlertTriangle } from 'lucide-react'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'

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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Commuter operations</p>
          <h1 className="text-[clamp(2rem,2.6vw,3rem)] font-black uppercase tracking-tight text-navy">Live Tracking</h1>
        </div>

        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
          <Search size={16} className="text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search route or stop..."
            className="w-full border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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

        <div className="flex flex-wrap gap-2">
          {filteredRoutes.map((route) => {
            const isSelected = selectedRoute === route.id
            const isAll = route.id === 'all'

            return (
              <button
                key={route.id}
                type="button"
                onClick={() => setSelectedRoute(route.id)}
                className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  isSelected
                    ? 'border-brand bg-brand text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-brand/40 hover:text-brand'
                } ${isAll ? 'min-w-[140px]' : ''}`}
              >
                {route.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[18px] border border-slate-200 bg-white p-0 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-slate-700">
              <BusFront size={16} className="text-brand" />
              {selectedRoute === 'all' ? 'All Active Buses' : selectedRoute}
            </div>

            <div className="text-xs font-medium text-slate-500">
              Live updates <span className="font-bold text-slate-700">12:00 PM</span>
            </div>
          </div>

          <div className="rounded-b-[18px] bg-[#dfeaf4] p-4">
            <div className="relative h-[540px] overflow-hidden rounded-[14px] border border-slate-300 bg-[#dfeaf4] shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.35),_rgba(255,255,255,0)_60%)]" />

              <div className="absolute inset-0">
                <div className="absolute left-0 top-0 h-full w-full opacity-50">
                  <div className="absolute left-0 top-0 h-full w-[2px] bg-white/80" />
                  <div className="absolute left-1/3 top-0 h-full w-[2px] bg-white/80" />
                  <div className="absolute left-[60%] top-0 h-full w-[2px] bg-white/80" />
                  <div className="absolute right-0 top-0 h-full w-[2px] bg-white/80" />

                  <div className="absolute left-0 top-6 h-[2px] w-full bg-white/80" />
                  <div className="absolute left-0 top-1/3 h-[2px] w-full bg-white/80" />
                  <div className="absolute left-0 top-2/3 h-[2px] w-full bg-white/80" />
                  <div className="absolute left-0 bottom-6 h-[2px] w-full bg-white/80" />
                </div>

                <div className="absolute left-[14%] top-[18%] h-24 w-24 rounded-full border-[2px] border-slate-200/80 bg-white/10" />
                <div className="absolute left-[52%] top-[22%] h-28 w-28 rounded-full border-[2px] border-slate-200/80 bg-white/10" />
                <div className="absolute left-[68%] top-[52%] h-24 w-24 rounded-full border-[2px] border-slate-200/80 bg-white/10" />
              </div>

              <div className="absolute left-8 top-8 flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 px-3 py-1.5 text-xs font-semibold text-slate-700 backdrop-blur-sm">
                <Navigation size={12} />
                {activeBusCount} active buses
              </div>

              <div className="absolute right-8 top-8 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-700 shadow-sm">
                <LocateFixed size={18} />
              </div>

              <div className="absolute bottom-8 right-8 h-16 w-16 rounded-full border-[7px] border-slate-100 bg-brand/90 shadow-[0_0_0_4px_rgba(255,255,255,0.6)]" />
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
