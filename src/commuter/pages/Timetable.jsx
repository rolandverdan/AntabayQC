import { useMemo, useState } from 'react'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'
import { routeColor } from '../../admin/utils/geo.js'
import RouteChip, { readableOn } from '../components/RouteChip.jsx'
import RouteTabs from '../components/RouteTabs.jsx'

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

// Interval shown under each time slot (same values the page showed before).
const INTERVALS = {
  weekday: ['10 minutes', '30 minutes', '10 minutes', '1 hour'],
  saturday: ['10 minutes', '30 minutes', '1 hour'],
  sunday: ['1 hour'],
}
const intervalLabel = (day, idx) => `${INTERVALS[day][idx] ?? INTERVALS[day][INTERVALS[day].length - 1]} interval`

const DAYS = [
  { key: 'weekday', label: 'Monday – Friday', short: 'Mon – Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Saturday' },
  { key: 'sunday', label: 'Sunday', short: 'Sunday' },
]

const todayKey = () => {
  const d = new Date().getDay()
  return d === 0 ? 'sunday' : d === 6 ? 'saturday' : 'weekday'
}

export default function Timetable() {
  const { routes, stopsById } = useAdminData()
  const [selectedRouteId, setSelectedRouteId] = useState('R-01')
  const [mobileDay, setMobileDay] = useState(todayKey) // on phones only one day is shown at a time

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) || routes[0],
    [routes, selectedRouteId],
  )

  const timetable = ROUTE_TIMETABLE[selectedRoute?.id] || ROUTE_TIMETABLE['R-01']
  const color = selectedRoute ? routeColor(selectedRoute.id, selectedRoute) : '#244A9B'
  const first = stopsById[selectedRoute?.stopIds[0]]?.name || 'Quezon City Hall'
  const last = stopsById[selectedRoute?.stopIds[selectedRoute.stopIds.length - 1]]?.name || 'Destination'

  const directions = [
    { key: 'forward', label: `${first} → ${last}` },
    { key: 'reverse', label: `${last} → ${first}` },
  ]

  // A day's column is hidden on phones unless it is the chosen day; desktop shows all three.
  const dayCell = (day) => (mobileDay === day ? '' : 'hidden md:table-cell')

  return (
    <div className="space-y-3">
      <RouteTabs />

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
        {/* The chips are the only route picker; the table below no longer repeats the route code. */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a route">
          {routes.map((route) => (
            <RouteChip key={route.id} route={route} selected={route.id === selectedRoute?.id} onClick={() => setSelectedRouteId(route.id)} />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold" style={{ background: color, color: readableOn(color) }}>
            {selectedRoute?.id.replace('R-', '')}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold leading-tight text-navy">{timetable.route}</h2>
            <p className="text-xs text-slate-500">Service windows and how often buses depart</p>
          </div>
        </div>

        <div className="mt-3 flex gap-1.5 rounded-xl bg-slate-100 p-1 md:hidden" role="group" aria-label="Choose a day">
          {DAYS.map(({ key, short }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMobileDay(key)}
              aria-pressed={mobileDay === key}
              className={`min-h-10 flex-1 rounded-lg px-2 text-sm font-semibold transition ${mobileDay === key ? 'bg-white text-brand shadow-sm' : 'text-slate-500'}`}
            >
              {short}
            </button>
          ))}
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full table-fixed border-collapse text-left">
            <thead>
              <tr className="text-sm text-white" style={{ background: color, color: readableOn(color) }}>
                <th scope="col" className="w-[38%] px-3 py-3 font-bold md:w-[28%] md:px-4">Direction</th>
                {DAYS.map(({ key, label, short }) => (
                  <th key={key} scope="col" className={`px-3 py-3 font-bold md:px-4 ${dayCell(key)}`}>
                    <span className="md:hidden">{short}</span>
                    <span className="hidden md:inline">{label}</span>
                  </th>
                ))}
              </tr>
            </thead>

            {directions.map(({ key: dir, label }) => {
              const rows = Math.max(...DAYS.map(({ key }) => timetable[key][dir].length))
              return (
                <tbody key={dir} className="border-t border-slate-200 first:border-t-0">
                  {Array.from({ length: rows }, (_, idx) => (
                    <tr key={idx} className={`align-top ${idx > 0 ? 'border-t border-slate-100' : ''}`}>
                      {idx === 0 && (
                        <th scope="row" rowSpan={rows} className="border-r border-slate-200 bg-slate-50 px-3 py-3 align-top text-sm font-bold leading-snug text-navy md:px-4">
                          {label}
                        </th>
                      )}
                      {DAYS.map(({ key }) => {
                        const slot = timetable[key][dir][idx]
                        return (
                          <td key={key} className={`px-3 py-2.5 md:px-4 ${dayCell(key)}`}>
                            {slot ? (
                              <>
                                <span className="block text-sm font-semibold text-slate-800">{slot}</span>
                                <span className="block text-xs text-slate-500">{intervalLabel(key, idx)}</span>
                              </>
                            ) : (
                              <span className="text-slate-300" aria-label="No service">–</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              )
            })}
          </table>
        </div>

        <p className="mt-3 text-center text-xs text-slate-500">Official City Bus Timetable • Quezon City Government (QC Bus System)</p>
      </div>
    </div>
  )
}
