import { routeColor } from '../../admin/utils/geo.js'

// Pick black or white text so the label stays readable on any route colour (e.g. the yellow R-03).
export function readableOn(hex = '#244A9B') {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return (r * 299 + g * 587 + b * 114) / 1000 > 160 ? '#1e293b' : '#ffffff'
}

// Route chip coloured by the route's assigned colour. Used everywhere a route is picked or named,
// so R-01 looks the same on Bus Routes, Timetable and Live Tracking.
export default function RouteChip({ route, selected = false, onClick, children, count, dim = false, className = '' }) {
  const color = routeColor(route.id, route)
  const base = 'inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40'
  const style = selected
    ? { background: color, borderColor: color, color: readableOn(color) }
    : { background: `${color}1A`, borderColor: `${color}66`, color: '#193B70' }

  const content = (
    <>
      {!selected && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />}
      <span>{children ?? route.id}</span>
      {count != null && (
        <span
          className="rounded-full px-1.5 text-[11px] leading-5"
          style={selected ? { background: 'rgba(255,255,255,0.28)' } : { background: '#ffffffcc' }}
        >
          {count}
        </span>
      )}
    </>
  )

  if (!onClick) return <span className={`${base} ${className}`} style={style}>{content}</span>

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`${base} ${selected ? 'shadow-sm ring-2 ring-offset-1' : 'hover:brightness-95'} ${dim && !selected ? 'opacity-60' : ''} ${className}`}
      style={{ ...style, ...(selected ? { '--tw-ring-color': `${color}55` } : null) }}
    >
      {content}
    </button>
  )
}
