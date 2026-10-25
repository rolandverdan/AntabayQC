import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../admin/components/Card.jsx'
import {
  BadgeCheck,
  BusFront,
  CheckCircle2,
  CirclePlus,
  Clock3,
  ArrowDownWideNarrow,
  Search,
  ShieldCheck,
  Store,
} from 'lucide-react'

const stats = [
  { label: 'Total reports', value: 4, detail: 'All logged records' },
  { label: 'Ready for claim', value: 1, detail: 'Pass issued · Matched' },
  { label: 'In depot transit', value: 1, detail: 'Found by bus crew' },
  { label: 'Pending', value: 1, detail: 'Inventory loop checking' },
  { label: 'Claimed', value: 1, detail: 'Archived releases' },
]

const reports = [
  {
    id: 'QC-LR-2026-0891',
    title: 'Wallet & QC Resident Card',
    status: 'Ready',
    filed: 'Sep 30, 2026',
    description: 'Brown leather bifold wallet with stamped initials “JDC”. Confirmed contents: Quezon City Citizen Q-ID, personalized Blue Beacon Bee Card, and minor cash envelope.',
    route: 'Route 1 (QC Hall ↔ Cubao)',
    bus: 'Bus #1042',
    priority: true,
  },
  {
    id: 'QC-LR-2026-1008',
    title: 'Backpack',
    status: 'In Review',
    filed: 'Oct 8, 2026',
    description: 'Navy backpack reported missing after a trip on Route 1.',
    route: 'Route 1 (QC Hall ↔ Cubao)',
    bus: 'Bus #1234',
    priority: false,
  },
]

const filters = ['All', 'Ready', 'In Review', 'Claimed']

export default function LostItemReports() {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [newestFirst, setNewestFirst] = useState(true)

  const filteredReports = useMemo(() => {
    const search = query.trim().toLowerCase()

    return reports.filter((report) => {
      const matchesFilter = activeFilter === 'All' || report.status === activeFilter
      const matchesSearch = !search || `${report.id} ${report.title} ${report.route} ${report.bus}`.toLowerCase().includes(search)
      return matchesFilter && matchesSearch
    }).sort((first, second) => {
      const dateDifference = new Date(second.filed).getTime() - new Date(first.filed).getTime()
      return newestFirst ? dateDifference : -dateDifference
    })
  }, [activeFilter, newestFirst, query])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lost Item Report"
        description="Review report progress and manage recovered-item claims."
        actions={<div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Store size={16} />
          </div>
          <div className="text-sm text-slate-600">
            <p className="font-bold text-slate-800">QC Central Terminal Depot</p>
            <p className="text-xs text-slate-500">Open Now · 08:00 – 17:00 PHT</p>
          </div>
        </div>}
      />

      <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm" aria-label="Lost item pages">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/commuter/lost-item" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-white hover:text-brand hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2">
            Report Lost Item
          </Link>
          <Link to="/commuter/lost-item-reports" aria-current="page" className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm ring-2 ring-brand/20 transition-all duration-150 hover:-translate-y-0.5 hover:bg-brand/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2">
            Check My Reports / Claims
          </Link>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <ShieldCheck size={15} className="text-sky-500" />
          Official QC Bus Commuter Protection Program
        </div>
      </nav>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" aria-label="Lost item report summary">
        {stats.map(({ label, value, detail }) => (
          <div key={label} className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black text-navy">{value}</p>
            <p className="text-xs font-medium text-slate-500">{detail}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
        <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <Search size={15} className="shrink-0 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by Case ID, item brand, route..."
            className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="flex flex-wrap gap-2" aria-label="Filter reports">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              aria-pressed={activeFilter === filter}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 active:translate-y-0 ${
                activeFilter === filter
                  ? 'bg-brand text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand/90 hover:shadow-md'
                  : 'border border-slate-200 bg-slate-50 text-slate-600 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-white hover:text-brand hover:shadow-sm'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setNewestFirst((current) => !current)}
          aria-label={`Sort by date, currently ${newestFirst ? 'newest first' : 'oldest first'}`}
          className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-white hover:text-brand hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 active:translate-y-0"
        >
          <ArrowDownWideNarrow size={14} />
          Date: {newestFirst ? 'Newest First' : 'Oldest First'}
        </button>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4" aria-label="Lost item reports">
          {filteredReports.length ? filteredReports.map((report) => (
            <article key={report.id} className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  {report.priority && <span className="font-bold text-slate-700">Priority Resolution</span>}
                  <span>•</span>
                  <span>Filed {report.filed}</span>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                  report.status === 'Ready' ? 'bg-green-100 text-green-700' :
                  report.status === 'Claimed' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'
                }`}>
                  {report.status === 'Ready' ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
                  {report.status === 'Ready' ? 'Ready for Pickup' : report.status}
                </span>
              </div>

              <h2 className="mt-3 text-lg font-bold text-navy">{report.title}</h2>
              <p className="mt-1 text-xs text-slate-500">Case Ref: <span className="font-semibold text-slate-700">{report.id}</span></p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{report.description}</p>

              <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-black text-white">R-01</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700">Lost Route &amp; Unit</p>
                  <p className="truncate text-sm text-slate-600">{report.route} · {report.bus}</p>
                </div>
                {report.status === 'Ready' && <BadgeCheck size={17} className="ml-auto shrink-0 text-green-600" />}
              </div>
            </article>
          )) : (
            <div className="rounded-[18px] border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No lost-item reports match your search.
            </div>
          )}
        </section>

        <aside className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <CirclePlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-navy">Have another lost item?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Every city bus is checked after each completed loop. File early to notify conductors immediately.</p>
            </div>
          </div>
          <Link to="/commuter/lost-item" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-brand/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 active:translate-y-0">
            <BusFront size={14} />
            File New Lost Report
          </Link>
        </aside>
      </div>
    </div>
  )
}
