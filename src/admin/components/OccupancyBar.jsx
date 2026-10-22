import { OCCUPANCY, occupancyLevel, occupancyPct } from '../utils/occupancy.js'

export default function OccupancyBar({ passengers, capacity }) {
  const level = occupancyLevel(passengers, capacity)
  const pct = occupancyPct(passengers, capacity)
  const o = OCCUPANCY[level]
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className={`font-semibold ${o.text}`}>{o.label}</span>
        <span className="text-slate-500">{passengers}/{capacity} ({pct}%)</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${o.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}
