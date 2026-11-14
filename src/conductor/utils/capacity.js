// Load status of the bus against the passenger limit the admin set (bus.capacity).
const STATUS = {
  unknown: { label: 'Limit not set', badge: 'bg-slate-100 text-slate-600 ring-slate-500/20', bar: 'bg-slate-400' },
  available: { label: 'Seats available', badge: 'bg-green-100 text-green-700 ring-green-600/20', bar: 'bg-green-500' },
  nearly: { label: 'Nearly full', badge: 'bg-amber-100 text-amber-800 ring-amber-600/20', bar: 'bg-amber-500' },
  full: { label: 'Full', badge: 'bg-red-100 text-red-700 ring-red-600/20', bar: 'bg-red-500' },
  over: { label: 'Overboard', badge: 'bg-red-600 text-white ring-red-700/40', bar: 'bg-red-600' },
}

export function capacityStatus(count, capacity) {
  const limit = Number(capacity)
  if (!Number.isFinite(limit) || limit <= 0) return { key: 'unknown', ...STATUS.unknown, limit: null, pct: null, over: 0 }
  const pct = Math.round((count / limit) * 100)
  const key = count > limit ? 'over' : count === limit ? 'full' : count / limit >= 0.8 ? 'nearly' : 'available'
  return { key, ...STATUS[key], limit, pct, over: Math.max(0, count - limit) }
}
