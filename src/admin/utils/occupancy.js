export const OCCUPANCY = {
  green: { label: 'Seats available', color: '#16a34a', bar: 'bg-green-500', text: 'text-green-700' },
  yellow: { label: 'Nearing capacity', color: '#f59e0b', bar: 'bg-amber-500', text: 'text-amber-700' },
  red: { label: 'Full / over capacity', color: '#dc2626', bar: 'bg-red-500', text: 'text-red-700' },
}

export const occupancyPct = (passengers, capacity) =>
  capacity ? Math.round((passengers / capacity) * 100) : 0

/** green < 70%, yellow 70–94%, red >= 95% */
export function occupancyLevel(passengers, capacity) {
  const pct = capacity ? passengers / capacity : 0
  if (pct >= 0.95) return 'red'
  if (pct >= 0.7) return 'yellow'
  return 'green'
}
