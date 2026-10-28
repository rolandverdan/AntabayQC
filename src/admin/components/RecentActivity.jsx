import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Card from './Card.jsx'
import Badge from './Badge.jsx'
import { fmtDateTime } from '../utils/format.js'

// One tabbed widget instead of three separate "recent logs" cards.
export default function RecentActivity({ emergencies, reports, logs }) {
  const [tab, setTab] = useState('emergencies')
  const byDate = (key) => (a, b) => b[key].localeCompare(a[key])

  const tabs = {
    emergencies: {
      label: 'Emergencies',
      to: '/admin/emergency-logs',
      items: [...emergencies].sort(byDate('datetime')).slice(0, 5),
      render: (e) => (
        <>
          <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold text-navy">{e.type} · {e.busId}</p><div className="flex shrink-0 gap-1"><Badge>{e.severity}</Badge><Badge>{e.status}</Badge></div></div>
          <p className="truncate text-xs text-slate-500">{e.id} · {fmtDateTime(e.datetime)}</p>
        </>
      ),
    },
    reports: {
      label: 'Reports',
      to: '/admin/report-logs',
      items: [...reports].sort(byDate('datetime')).slice(0, 5),
      render: (r) => (
        <>
          <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold text-navy">{r.type} · {r.busId}</p><Badge>{r.status}</Badge></div>
          <p className="truncate text-xs text-slate-500">{r.id} · {fmtDateTime(r.datetime)}</p>
        </>
      ),
    },
    system: {
      label: 'System',
      to: '/admin/logs',
      items: logs.slice(0, 5),
      render: (l) => (
        <>
          <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold text-navy">{l.action}</p><Badge>{l.severity}</Badge></div>
          <p className="truncate text-xs text-slate-500">{l.module} · {fmtDateTime(l.timestamp)}</p>
        </>
      ),
    },
  }
  const cur = tabs[tab]

  return (
    <Card
      title="Recent activity"
      action={<Link to={cur.to} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">View all <ArrowRight size={13} /></Link>}
      bodyClass="p-0"
    >
      <div role="tablist" aria-label="Recent activity" className="flex gap-1 border-b border-slate-100 px-3 pt-2">
        {Object.entries(tabs).map(([key, t]) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`ra-tab-${key}`}
            aria-selected={tab === key}
            aria-controls="ra-panel"
            onClick={() => setTab(key)}
            className={`-mb-px rounded-t-lg border-b-2 px-3 py-2 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-brand/40 ${tab === key ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-navy'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div id="ra-panel" role="tabpanel" aria-labelledby={`ra-tab-${tab}`}>
        {cur.items.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Nothing to show yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">{cur.items.map((it) => <li key={it.id} className="px-5 py-3">{cur.render(it)}</li>)}</ul>
        )}
      </div>
    </Card>
  )
}
