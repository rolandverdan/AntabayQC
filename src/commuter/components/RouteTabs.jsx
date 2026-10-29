import { NavLink } from 'react-router-dom'
import { Clock3 } from 'lucide-react'

const tab = ({ isActive }) =>
  `rounded-lg px-3.5 py-2 text-sm font-semibold transition ${isActive ? 'bg-brand text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`

// Compact top bar shared by Bus Routes and Timetable: the two tabs and the daily service hours in one slim row.
export default function RouteTabs() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="flex gap-1.5">
        <NavLink to="/commuter/route-and-schedule" className={tab}>Bus Routes</NavLink>
        <NavLink to="/commuter/timetable" className={tab}>Timetable</NavLink>
      </div>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
        <Clock3 size={14} className="text-brand" />
        <span>Daily 6:00 AM – 9:00 PM</span>
        <span className="hidden text-slate-400 sm:inline">· Mon – Sun, except holidays</span>
      </p>
    </div>
  )
}
