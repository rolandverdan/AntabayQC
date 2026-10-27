import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'
import { PageHeader } from '../../admin/components/Card.jsx'

const ROUTE_TIMETABLE = {
  'R-01': {
    route: 'Quezon City Hall ↔ Cubao',
    weekday: {
      forward: ['6:00 AM – 11:30 AM', '11:30 AM – 4:00 PM', '4:00 PM – 8:00 PM', '8:00 PM – 9:00 PM'],
      reverse: ['6:00 AM – 11:30 AM', '11:30 AM – 4:00 PM', '4:00 PM – 8:00 PM', '8:00 PM – 9:00 PM'],
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
    sunday: { forward: ['8:00 AM – 9:00 PM'], reverse: ['8:00 AM – 9:00 PM'] },
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
    sunday: { forward: ['8:00 AM – 9:00 PM'], reverse: ['8:00 AM – 9:00 PM'] },
  },
  'R-04': {
    route: 'QC Hall ↔ General Luis Avenue',
    weekday: {
      forward: ['6:00 AM – 11:30 AM', '11:30 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
      reverse: ['6:00 AM – 11:30 AM', '11:30 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
    },
    saturday: {
      forward: ['7:00 AM – 9:00 AM', '9:00 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
      reverse: ['7:00 AM – 9:00 AM', '9:00 AM – 4:00 PM', '4:00 PM – 8:00 PM'],
    },
    sunday: { forward: ['8:00 AM – 9:00 PM'], reverse: ['8:00 AM – 9:00 PM'] },
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
    sunday: { forward: ['8:00 AM – 9:00 PM'], reverse: ['8:00 AM – 9:00 PM'] },
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
    sunday: { forward: ['8:00 AM – 9:00 PM'], reverse: ['8:00 AM – 9:00 PM'] },
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
    sunday: { forward: ['8:00 AM – 9:00 PM'], reverse: ['8:00 AM – 9:00 PM'] },
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
    sunday: { forward: ['8:00 AM – 9:00 PM'], reverse: ['8:00 AM – 9:00 PM'] },
  },
}

const buttonBase = 'rounded-xl px-3 py-2 text-sm font-semibold transition'

export default function Timetable() {
  const { routes } = useAdminData()
  const [selectedRouteId, setSelectedRouteId] = useState('R-01')

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) || routes[0],
    [routes, selectedRouteId],
  )

  const selectedTimetable = ROUTE_TIMETABLE[selectedRoute?.id] || ROUTE_TIMETABLE['R-01']

  return (
    <div className="space-y-5">
      <PageHeader title="Timetable" description="Review service hours and departure times by route and day." />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
        Daily service · Weekdays &amp; weekends · Holiday operations may vary.
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
          <NavLink to="/commuter/route-and-schedule" className={({ isActive }) => `${buttonBase} ${isActive ? 'bg-brand text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
            Bus Routes
          </NavLink>
          <NavLink to="/commuter/timetable" className={({ isActive }) => `${buttonBase} ${isActive ? 'bg-brand text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
            Timetable
          </NavLink>
        </div>

        <div className="p-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {['R-01', 'R-02', 'R-03', 'R-04', 'R-05', 'R-06', 'R-07', 'R-08'].map((routeId) => (
              <button
                key={routeId}
                type="button"
                onClick={() => setSelectedRouteId(routeId)}
                className={`rounded-md border px-3 py-2.5 text-xs font-semibold sm:py-1.5 ${selectedRoute?.id === routeId ? 'border-brand bg-brand text-white' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
              >
                {routeId}
              </button>
            ))}
          </div>

          <p className="mb-2 text-xs font-medium text-slate-500 md:hidden">Swipe sideways to see Saturday and Sunday.</p>
          <div className="overflow-x-auto overscroll-x-contain rounded-2xl border border-slate-200 bg-slate-50">
            <div className="grid min-w-[640px] grid-cols-[1.3fr_1fr_1fr_1fr] bg-[#1e6ea6] text-sm font-bold text-white">
              <div className="px-4 py-3">{selectedRoute?.id || 'R-01'}</div>
              <div className="px-4 py-3 text-center">Monday - Friday</div>
              <div className="px-4 py-3 text-center">Saturday</div>
              <div className="px-4 py-3 text-center">Sunday</div>
            </div>

            <div className="grid min-w-[640px] grid-cols-[1.3fr_1fr_1fr_1fr] border-t border-slate-200 text-sm">
              <div className="border-r border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-extrabold uppercase tracking-[0.08em] text-navy">{selectedRoute?.id || 'R-01'}</div>
                  <div className="rounded bg-red-500 px-2 py-1 text-[10px] font-bold text-white">{selectedRoute?.name || 'Route'}</div>
                </div>
                <div className="mt-4 space-y-3 text-[15px] font-semibold text-slate-700">
                  <div className="font-black text-[1.3rem] leading-tight text-navy">{selectedTimetable.route}</div>
                  <div className="text-slate-500">Quezon City Hall → Destination</div>
                  <div className="text-slate-500">Destination → Quezon City Hall</div>
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

            <div className="grid min-w-[640px] grid-cols-[1.3fr_1fr_1fr_1fr] border-t border-slate-200 text-sm">
              <div className="border-r border-slate-200 bg-white p-4 font-black text-navy uppercase">{selectedRoute?.name || 'Route'}</div>

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

          <div className="mt-4 hidden text-center text-xs text-slate-500 md:block">Official City Bus Timetable • Quezon City Government (QC Bus System)</div>
        </div>
      </div>
    </div>
  )
}
