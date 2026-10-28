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
    <div className="space-y-6 md:space-y-5">
      <PageHeader
        title="Lost Item Report"
        description="Review report progress and manage recovered-item claims."
        actions={<div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Store size={16} />
          </div>
          <div className="text-sm text-slate-600">
            <p className="font-bold text-slate-800">QC Central Terminal Depot</p>
            <p className="text-xs text-slate-500">Open Now · 08:00 – 17:00 PHT</p>
          </div>
        </div>}
      />

      <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-3 shadow-sm md:px-4" aria-label="Lost item pages">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <Link to="/commuter/lost-item" className="rounded-xl border border-slate-400 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-50 hover:text-brand hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 md:border-slate-200 md:bg-slate-50 md:px-4 md:text-sm md:text-slate-700 md:hover:border-brand/30 md:hover:bg-white">
            Report Lost Item
          </Link>
          <Link to="/commuter/lost-item-reports" aria-current="page" className="rounded-xl border border-brand bg-brand px-3 py-2 text-xs font-bold text-white shadow-sm ring-2 ring-brand/20 transition-all duration-150 hover:-translate-y-0.5 hover:bg-brand/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 md:border-0 md:px-4 md:text-sm">
            Check My Reports / Claims
          </Link>
        </div>
        <div className="hidden items-center gap-2 text-xs font-semibold text-slate-700 md:flex">
          <ShieldCheck size={15} className="text-sky-500" />
          Official QC Bus Commuter Protection Program
        </div>
      </nav>

      <section className="hidden grid-cols-1 gap-4 md:grid md:grid-cols-3 xl:grid-cols-5" aria-label="Lost item report summary">
        {stats.map(({ label, value, detail }) => (
          <div key={label} className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black text-navy">{value}</p>
            <p className="text-xs font-medium text-slate-500">{detail}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4 rounded-[18px] border border-slate-300 bg-white p-4 shadow-sm md:border-slate-200 md:shadow-sm md:gap-3 lg:flex-row lg:items-center">
        <div className="flex w-full min-w-0 items-center gap-2 lg:flex-1">
          <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 md:border-slate-200 md:bg-slate-50 md:shadow-none md:focus-within:ring-0">
            <Search size={15} className="shrink-0 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by Case ID, item brand, route..."
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-500"
            />
          </label>

          <button
            type="button"
            onClick={() => setNewestFirst((current) => !current)}
            aria-label={`Sort by date, currently ${newestFirst ? 'newest first' : 'oldest first'}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand bg-brand text-white shadow-sm transition-all duration-150 hover:bg-brand/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 md:h-10 md:w-auto md:gap-2 md:border-slate-200 md:bg-slate-50 md:px-3 md:text-xs md:font-semibold md:text-slate-700 md:shadow-none md:hover:border-brand/30 md:hover:bg-white md:hover:text-brand"
          >
            <ArrowDownWideNarrow size={16} className={`transition-transform ${newestFirst ? '' : 'rotate-180 md:rotate-0'}`} />
            <span className="hidden md:inline">Date: {newestFirst ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Filter reports">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              aria-pressed={activeFilter === filter}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 active:translate-y-0 ${
                activeFilter === filter
                  ? 'border border-brand bg-brand text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand/90 hover:shadow-md md:border-0'
                  : 'border border-slate-400 bg-white text-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-50 hover:text-brand hover:shadow-sm md:border-slate-200 md:bg-slate-50 md:text-slate-600 md:shadow-none md:hover:border-brand/30 md:hover:bg-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

      </section>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5 md:space-y-4" aria-label="Lost item reports">
          {filteredReports.length ? filteredReports.map((report) => (
            <article key={report.id} className="rounded-[18px] border border-slate-300 bg-white p-4 shadow-sm md:border-slate-200 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  {report.priority && <span className="font-bold text-slate-700">Priority Resolution</span>}
                  <span>•</span>
                  <span>Filed {report.filed}</span>
                </div>
                <span className={`commuter-status-tag inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                  report.status === 'Ready' ? 'bg-green-100 text-green-800 md:text-green-700' :
                  report.status === 'Claimed' ? 'bg-slate-100 text-slate-700 md:text-slate-600' : 'bg-blue-100 text-blue-800 md:text-blue-700'
                }`}>
                  {report.status === 'Ready' ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
                  {report.status === 'Ready' ? 'Ready for Pickup' : report.status}
                </span>
              </div>

              <h2 className="mt-4 text-lg font-bold text-navy md:mt-3">{report.title}</h2>
              <p className="mt-1 text-xs text-slate-500">Case Ref: <span className="font-semibold text-slate-700">{report.id}</span></p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:mt-2">{report.description}</p>

              <div className="mt-5 flex items-center gap-3 rounded-xl border border-brand/20 bg-brand/5 p-3 md:mt-4 md:border-slate-200 md:bg-slate-50">
                <span className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-black text-white">R-01</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700">Lost Route &amp; Unit</p>
                  <p className="truncate text-sm text-slate-700">{report.route} · {report.bus}</p>
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

        <aside className="rounded-[18px] border border-slate-300 bg-white p-4 shadow-sm md:border-slate-200 md:p-5">
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
