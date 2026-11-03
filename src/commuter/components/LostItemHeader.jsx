import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ShieldCheck, Store } from 'lucide-react'
import { PageHeader } from '../../admin/components/Card.jsx'

const isTtmdOpenNow = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date())
  const value = (type) => parts.find((part) => part.type === type)?.value
  const minutes = Number(value('hour')) * 60 + Number(value('minute'))
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(value('weekday')) && minutes >= 8 * 60 && minutes < 17 * 60
}

const tab = ({ isActive }) =>
  `flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg px-2 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
    isActive ? 'bg-brand text-white shadow-sm' : 'text-slate-600 hover:bg-white/70'
  }`

/**
 * Shared top of the Lost Item pages: title, full-width depot card, one-line segmented tabs.
 * `showProgram` adds the "Official QC Bus Commuter Protection Program" note below the tabs (kept outside the tab bar).
 */
export default function LostItemHeader({ description, showProgram = false }) {
  const [open, setOpen] = useState(isTtmdOpenNow)
  useEffect(() => {
    const timer = window.setInterval(() => setOpen(isTtmdOpenNow()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <>
      <PageHeader title="Lost Item" description={description} />

      <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><Store size={18} /></span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-navy">QC TTMD Lost &amp; Found</p>
          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
            <span className={`flex items-center gap-1.5 font-semibold ${open ? 'text-green-600' : 'text-slate-500'}`}>
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${open ? 'bg-green-500' : 'bg-slate-400'}`} />
              {open ? 'Open now' : 'Closed now'}
            </span>
            <span>· Mon–Fri · 8:00 AM–5:00 PM PHT</span>
          </p>
          <p className="text-[11px] text-slate-400">2nd Floor, DPOS Building, QC Hall Compound</p>
        </div>
      </div>

      <nav className="grid grid-cols-2 gap-1 rounded-xl bg-slate-200/70 p-1" aria-label="Lost item pages">
        <NavLink to="/commuter/lost-item" end className={tab}>Report Lost Item</NavLink>
        <NavLink to="/commuter/lost-item-reports" className={tab}>My Reports / Claims</NavLink>
      </nav>

      {showProgram && (
        <p className="flex items-center gap-2 px-1 text-xs font-semibold text-navy">
          <ShieldCheck size={16} className="shrink-0 text-sky-500" aria-hidden="true" />
          Official QC Bus Commuter Protection Program
        </p>
      )}
    </>
  )
}
