import { NavLink } from 'react-router-dom'
import { Clock3 } from 'lucide-react'

const tab = ({ isActive }) =>
  `flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-semibold transition ${isActive ? 'bg-brand text-white shadow-sm' : 'text-slate-600 hover:bg-white/70'}`

// Shared by Bus Routes and Timetable: a full-width segmented control (both tabs the same size),
// then a full-width service-hours banner so nothing is left floating with empty white space.
export default function RouteTabs() {
  return (
    <div className="space-y-3">
      <nav aria-label="Routes and timetable" className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200/70 p-1">
        <NavLink to="/commuter/route-and-schedule" className={tab}>Bus Routes</NavLink>
        <NavLink to="/commuter/timetable" className={tab}>Timetable</NavLink>
      </nav>
      <div className="flex items-center gap-3 rounded-2xl border border-brand/15 bg-brand/5 px-4 py-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white"><Clock3 size={16} /></span>
        <p className="min-w-0 leading-tight">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Service hours</span>
          <span className="block text-sm font-bold text-navy">Daily · 6:00 AM – 9:00 PM <span className="hidden font-medium text-slate-500 sm:inline">· Mon – Sun, except holidays</span></span>
        </p>
      </div>
    </div>
  )
}
