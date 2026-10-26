import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'

const ROUTE_TIMETABLE = {
  'R-01': {
    route: 'Quezon City Hall ↔ Cubao',
    weekday: {
      forward: [
        '6:00 AM – 11:30 AM',
        '11:30 AM – 4:00 PM',
        '4:00 PM – 8:00 PM',
        '8:00 PM – 9:00 PM',
      ],
      reverse: [
        '6:00 AM – 11:30 PM',
        '11:30 AM – 4:00 PM',
        '4:00 PM – 8:00 PM',
        '8:00 PM – 9:00 PM',
      ],
    },
    saturday: {
      forward: ['6:30 AM – 8:30 AM', '8:30 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
      reverse: ['6:30 AM – 8:30 AM', '8:30 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
    },
    sunday: {
      forward: ['8:00 AM – 9:00 PM'],
      reverse: ['8:00 AM – 9:00 PM'],
    },
  },
  'R-02': {
    route: 'Quezon City Hall ↔ Litex / IBP Road',
    weekday: {
      forward: ['6:00 AM – 11:30 AM', '11:30 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
      reverse: ['6:30 AM – 11:00 AM', '11:00 AM – 4:30 PM', '4:30 PM – 8:00 PM'],
    },
    saturday: {
      forward: ['6:30 AM – 9:00 AM', '9:00 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
      reverse: ['6:30 AM – 9:00 AM', '9:00 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
    },
    sunday: {
      forward: ['8:00 AM – 9:00 PM'],
      reverse: ['8:00 AM – 9:00 PM'],
    },
  },
  'R-03': {
    route: 'Welcome Rotonda ↔ Aurora-Katipunan',
    weekday: {
      forward: ['6:00 AM – 11:30 AM', '11:30 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
      reverse: ['6:00 AM – 11:00 AM', '11:00 AM – 4:30 PM', '4:30 PM – 8:00 PM'],
    },
    saturday: {
      forward: ['6:30 AM – 8:30 AM', '8:30 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
      reverse: ['6:30 AM – 8:30 AM', '8:30 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
    },
    sunday: {
      forward: ['8:00 AM – 9:00 PM'],
      reverse: ['8:00 AM – 9:00 PM'],
    },
  },
  'R-04': {
    route: 'QC Hall ↔ General Luis',
    weekday: {
      forward: ['6:00 AM – 11:30 AM', '11:30 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
      reverse: ['6:00 AM – 11:30 AM', '11:30 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
    },
    saturday: {
      forward: ['7:00 AM – 9:00 AM', '9:00 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
      reverse: ['7:00 AM – 9:00 AM', '9:00 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
    },
    sunday: {
      forward: ['8:00 AM – 9:00 PM'],
      reverse: ['8:00 AM – 9:00 PM'],
    },
  },
  'R-05': {
    route: 'Quezon City Hall ↔ Mindanao Avenue',
    weekday: {
      forward: ['6:00 AM – 11:30 AM', '11:30 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
      reverse: ['6:00 AM – 11:30 AM', '11:30 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
    },
    saturday: {
      forward: ['6:30 AM – 9:00 AM', '9:00 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
      reverse: ['6:30 AM – 9:00 AM', '9:00 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
    },
    sunday: {
      forward: ['8:00 AM – 9:00 PM'],
      reverse: ['8:00 AM – 9:00 PM'],
    },
  },
  'R-06': {
    route: 'Quezon City Hall ↔ Gilmore Avenue',
    weekday: {
      forward: ['6:00 AM – 11:30 AM', '11:30 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
      reverse: ['6:00 AM – 11:30 AM', '11:30 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
    },
    saturday: {
      forward: ['6:30 AM – 9:00 AM', '9:00 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
      reverse: ['6:30 AM – 9:00 AM', '9:00 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
    },
    sunday: {
      forward: ['8:00 AM – 9:00 PM'],
      reverse: ['8:00 AM – 9:00 PM'],
    },
  },
  'R-07': {
    route: 'Quezon City Hall ↔ Ortigas Avenue',
    weekday: {
      forward: ['6:00 AM – 11:30 AM', '11:30 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
      reverse: ['6:00 AM – 11:00 AM', '11:00 AM – 4:30 PM', '4:30 PM – 8:00 PM'],
    },
    saturday: {
      forward: ['7:00 AM – 9:00 AM', '9:00 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
      reverse: ['7:00 AM – 9:00 AM', '9:00 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
    },
    sunday: {
      forward: ['8:00 AM – 9:00 PM'],
      reverse: ['8:00 AM – 9:00 PM'],
    },
  },
  'R-08': {
    route: 'Quezon City Hall ↔ Muñoz',
    weekday: {
      forward: ['6:00 AM – 11:30 AM', '11:30 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
      reverse: ['6:00 AM – 11:30 AM', '11:30 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
    },
    saturday: {
      forward: ['6:30 AM – 9:00 AM', '9:00 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
      reverse: ['6:30 AM – 9:00 AM', '9:00 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
    },
    sunday: {
      forward: ['8:00 AM – 9:00 PM'],
      reverse: ['8:00 AM – 9:00 PM'],
    },
  },
}

function getRouteDirection(route) {
  const firstStop = route.stopIds.map((id) => route.stopIds[0]).join('')
  const lastStop = route.stopIds[route.stopIds.length - 1]
  if (!route || !route.stopIds?.length) return 'Route'
  return `${route.name}`
}

export default function RoutesAndSchedules() {
  const { routes, stopsById } = useAdminData()
  const [query, setQuery] = useState('')
  const [selectedRouteId, setSelectedRouteId] = useState('R-01')
  const [activeTab, setActiveTab] = useState('timetable')

  const filteredRoutes = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return routes

    return routes.filter((route) => {
      const haystack = `${route.id} ${route.name} ${route.stopIds.map((id) => stopsById[id]?.name || '').join(' ')}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [query, routes, stopsById])

  const selectedRoute = filteredRoutes.find((route) => route.id === selectedRouteId) || filteredRoutes[0] || routes[0]

  const selectedTimetable = ROUTE_TIMETABLE[selectedRoute?.id] || ROUTE_TIMETABLE['R-01']

  const formatDirection = (label) => {
    if (label === 'forward') return 'Quezon City Hall → Destination'
    return 'Destination → Quezon City Hall'
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[clamp(1.6rem,2vw,2.5rem)] font-bold leading-tight text-navy">Standard City Operations Schedule</h1>
            <p className="mt-1 text-sm text-slate-500">Daily • Weekdays &amp; Weekends<br />Holiday operations may vary.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-100/80 px-5 py-4 text-center shadow-inner">
            <p className="text-[2rem] font-bold leading-none text-navy">6:00 AM – 9:00 PM</p>
            <p className="mt-2 text-base text-slate-600">Monday – Sunday</p>
            <p className="text-sm text-slate-500">Except on holidays</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex gap-2 text-sm font-bold text-slate-700">
              <button type="button" onClick={() => setActiveTab('routes')} className={`rounded-xl px-3 py-2 ${activeTab === 'routes' ? 'bg-brand text-white shadow-sm' : 'text-slate-500'}`}>
                Bus Routes
              </button>
              <button type="button" onClick={() => setActiveTab('timetable')} className={`rounded-xl px-3 py-2 ${activeTab === 'timetable' ? 'bg-brand text-white shadow-sm' : 'text-slate-500'}`}>
                Timetable
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Search size={16} className="text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                placeholder="Search routes or stops"
              />
            </div>

            <div className="space-y-3">
              {filteredRoutes.map((route) => {
                const isSelected = route.id === selectedRoute?.id
                const short = route.id.replace('R-', '')
                const stops = route.stopIds.map((id) => stopsById[id]).filter(Boolean)

                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => {
                      setSelectedRouteId(route.id)
                      setActiveTab('timetable')
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                      isSelected ? 'border-brand bg-brand/5 shadow-sm' : 'border-slate-200 bg-slate-50 hover:border-brand/30 hover:bg-white'
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: route.color }}>
                      {short}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-bold text-navy">{route.name}</span>
                      <span className="block truncate text-xs text-slate-500">{stops[0]?.name || 'Origin'} → {stops[stops.length - 1]?.name || 'Destination'}</span>
                    </span>
                    <span className="text-xl text-slate-400">›</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-brand">
                {selectedRoute?.id?.replace('R-', '') || 'R'}
              </span>
              <span className="text-lg font-bold text-navy">{selectedRoute?.name || 'No route selected'}</span>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {['R-01', 'R-02', 'R-03', 'R-04', 'R-05', 'R-06', 'R-07', 'R-08'].map((routeId) => (
              <button
                key={routeId}
                type="button"
                onClick={() => setSelectedRouteId(routeId)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                  selectedRoute?.id === routeId ? 'border-brand bg-brand text-white' : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                {routeId}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] bg-[#1e6ea6] text-sm font-bold text-white">
              <div className="px-4 py-3">{selectedRoute?.id || 'R-01'}</div>
              <div className="px-4 py-3 text-center">Monday - Friday</div>
              <div className="px-4 py-3 text-center">Saturday</div>
              <div className="px-4 py-3 text-center">Sunday</div>
            </div>

            <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] border-t border-slate-200 text-sm">
              <div className="border-r border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-extrabold uppercase tracking-[0.08em] text-navy">{selectedRoute?.id || 'R-01'}</div>
                  <div className="rounded bg-red-500 px-2 py-1 text-[10px] font-bold text-white">{selectedRoute?.name || 'Line'}</div>
                </div>

                <div className="mt-4 space-y-3 text-[15px] font-semibold text-slate-700">
                  <div className="font-black text-[1.3rem] leading-tight text-navy">{selectedTimetable.route}</div>
                  <div className="text-slate-500">{formatDirection('forward')}</div>
                  <div className="text-slate-500">{formatDirection('reverse')}</div>
                </div>
              </div>

              <div className="border-r border-slate-200 bg-[#edf7ff] p-3">
                {(selectedTimetable.weekday.forward || []).map((slot, idx) => (
                  <div key={`wd-f-${idx}`} className="mb-3 rounded-lg border border-sky-200 bg-sky-50 px-2 py-2 text-center text-xs font-semibold text-slate-700">
                    {slot}<br />
                    <span className="text-[10px] text-slate-500">{idx === 0 ? '(10 minutes interval)' : idx === 1 ? '(30 minutes interval)' : idx === 2 ? '(10 minutes interval)' : '(1 hour interval)'}</span>
                  </div>
                ))}
              </div>

              <div className="border-r border-slate-200 bg-[#eefaf0] p-3">
                {(selectedTimetable.saturday.forward || []).map((slot, idx) => (
                  <div key={`sat-f-${idx}`} className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-center text-xs font-semibold text-slate-700">
                    {slot}<br />
                    <span className="text-[10px] text-slate-500">{idx === 0 ? '(10 minutes interval)' : idx === 1 ? '(30 minutes interval)' : '(1 hour interval)'}</span>
                  </div>
                ))}
              </div>

              <div className="bg-[#f6f8fb] p-3">
                {(selectedTimetable.sunday.forward || []).map((slot, idx) => (
                  <div key={`sun-f-${idx}`} className="mb-3 rounded-lg border border-slate-200 bg-slate-100 px-2 py-2 text-center text-xs font-semibold text-slate-700">
                    {slot}<br />
                    <span className="text-[10px] text-slate-500">(1 hour interval)</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] border-t border-slate-200 text-sm">
              <div className="border-r border-slate-200 bg-white p-4 font-black text-navy uppercase">
                {selectedRoute?.name || 'Route'}
              </div>

              <div className="border-r border-slate-200 bg-[#edf7ff] p-3">
                {(selectedTimetable.weekday.reverse || []).map((slot, idx) => (
                  <div key={`wd-r-${idx}`} className="mb-3 rounded-lg border border-sky-200 bg-sky-50 px-2 py-2 text-center text-xs font-semibold text-slate-700">
                    {slot}<br />
                    <span className="text-[10px] text-slate-500">{idx === 0 ? '(10 minutes interval)' : idx === 1 ? '(30 minutes interval)' : idx === 2 ? '(10 minutes interval)' : '(1 hour interval)'}</span>
                  </div>
                ))}
              </div>

              <div className="border-r border-slate-200 bg-[#eefaf0] p-3">
                {(selectedTimetable.saturday.reverse || []).map((slot, idx) => (
                  <div key={`sat-r-${idx}`} className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-center text-xs font-semibold text-slate-700">
                    {slot}<br />
                    <span className="text-[10px] text-slate-500">{idx === 0 ? '(10 minutes interval)' : idx === 1 ? '(30 minutes interval)' : '(1 hour interval)'}</span>
                  </div>
                ))}
              </div>

              <div className="bg-[#f6f8fb] p-3">
                {(selectedTimetable.sunday.reverse || []).map((slot, idx) => (
                  <div key={`sun-r-${idx}`} className="mb-3 rounded-lg border border-slate-200 bg-slate-100 px-2 py-2 text-center text-xs font-semibold text-slate-700">
                    {slot}<br />
                    <span className="text-[10px] text-slate-500">(1 hour interval)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-slate-500">
            Official City Bus Timetable • Quezon City Government (QC Bus System)
          </div>
        </div>
      </div>
    </div>
  )
}
