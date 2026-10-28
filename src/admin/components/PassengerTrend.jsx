import { useId, useMemo } from 'react'
import Card from './Card.jsx'

// Hours of service shown on the graph, and a typical commuter load curve (share of fleet capacity boarding each hour).
// There is no passenger-count feed in this frontend-only app, so the curve is SAMPLE data scaled by the
// fleet's real capacity. It is labelled as such on screen.
const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
const LOAD = [0.12, 0.42, 0.9, 0.78, 0.5, 0.36, 0.34, 0.42, 0.4, 0.36, 0.42, 0.6, 0.88, 0.82, 0.55, 0.3, 0.14]

const hourLabel = (h) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`
const W = 640, H = 240, L = 46, R = 16, T = 18, B = 34

export default function PassengerTrend({ buses }) {
  const gid = useId().replace(/:/g, '')
  const { points, max, peakAm, peakPm, ticks } = useMemo(() => {
    const active = buses.filter((b) => b.status === 'Active')
    const capacity = (active.length ? active : buses).reduce((n, b) => n + (Number(b.capacity) || 0), 0) || 1
    const values = LOAD.map((f) => Math.round(f * capacity * 2))
    const top = Math.max(...values)
    const step = top > 400 ? 100 : top > 160 ? 50 : 20
    const niceMax = Math.ceil(top / step) * step
    const x = (i) => L + (i * (W - L - R)) / (HOURS.length - 1)
    const y = (v) => T + (1 - v / niceMax) * (H - T - B)
    const pts = values.map((v, i) => ({ hour: HOURS[i], v, x: x(i), y: y(v) }))
    const best = (arr) => arr.reduce((a, p) => (p.v > a.v ? p : a), arr[0])
    return {
      points: pts,
      max: niceMax,
      peakAm: best(pts.filter((p) => p.hour < 12)),
      peakPm: best(pts.filter((p) => p.hour >= 12)),
      ticks: Array.from({ length: 5 }, (_, i) => Math.round((niceMax / 4) * i)),
    }
  }, [buses])

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${points[points.length - 1].x},${H - B} L${points[0].x},${H - B} Z`
  const y = (v) => T + (1 - v / max) * (H - T - B)
  const peaks = [peakAm, peakPm]

  return (
    <Card title="Passenger trend" action={<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Sample data</span>}>
      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-lg bg-brand/5 px-2.5 py-1 text-slate-600">Morning peak: <b className="text-navy">{hourLabel(peakAm.hour)}</b> · {peakAm.v} passengers</span>
        <span className="rounded-lg bg-brand/5 px-2.5 py-1 text-slate-600">Evening peak: <b className="text-navy">{hourLabel(peakPm.hour)}</b> · {peakPm.v} passengers</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full text-brand" role="img" aria-label={`Passengers per hour across the service day. Morning peak at ${hourLabel(peakAm.hour)}, evening peak at ${hourLabel(peakPm.hour)}. Sample data.`}>
        <defs>
          <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeDasharray={t === 0 ? undefined : '3 4'} />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#64748b">{t}</text>
          </g>
        ))}
        {points.filter((p) => p.hour % 2 === 0).map((p) => (
          <text key={p.hour} x={p.x} y={H - 12} textAnchor="middle" fontSize="11" fill="#64748b">{hourLabel(p.hour)}</text>
        ))}
        <path d={area} fill={`url(#g${gid})`} />
        <path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p) => (
          <circle key={p.hour} cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke="currentColor" strokeWidth="2">
            <title>{`${hourLabel(p.hour)}: ${p.v} passengers`}</title>
          </circle>
        ))}
        {peaks.map((p) => (
          <g key={`peak-${p.hour}`}>
            <circle cx={p.x} cy={p.y} r="6.5" fill="#dc2626" stroke="#fff" strokeWidth="2" />
            <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="11" fontWeight="700" fill="#b91c1c">Peak</text>
          </g>
        ))}
      </svg>
      <p className="mt-2 text-[11px] text-slate-500">Estimated boardings per hour (5 AM – 9 PM), scaled to the capacity of the buses in service. Demonstration values, not live passenger counts.</p>
    </Card>
  )
}
