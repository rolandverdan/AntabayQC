import {
  ArrowRight,
  Clock3,
  MapPin,
  Route as RouteIcon,
  ShieldCheck,
  Star,
  Ticket,
} from 'lucide-react'
import { PageHeader } from '../../admin/components/Card.jsx'

const upcomingTrips = [
  {
    route: 'R-02 QC Hall ↔ Commonwealth',
    time: 'Today · 7:40 AM',
    from: 'Quezon Memorial Circle',
    to: 'Commonwealth Avenue',
    status: 'On time',
    tone: 'green',
  },
  {
    route: 'R-03 Cubao ↔ Katipunan',
    time: 'Today · 8:20 AM',
    from: 'Cubao Terminal',
    to: 'Katipunan Ave',
    status: 'Boarding soon',
    tone: 'blue',
  },
]

const tripHistory = [
  { route: 'R-01 QC Hall ↔ Cubao', date: 'Oct 22', fare: '₱20', rating: 4.8 },
  { route: 'R-05 Batasan ↔ Eastwood', date: 'Oct 20', fare: '₱20', rating: 4.6 },
  { route: 'R-02 QC Hall ↔ Commonwealth', date: 'Oct 18', fare: '₱20', rating: 4.9 },
]

export default function MyTrip() {
  return (
    <>
      <PageHeader
        title="My Trip"
        description="Review your upcoming commute, recent trips, and route details in one place."
      />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5">
          <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Ticket size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-navy">Upcoming trip</h2>
                  <p className="text-sm text-slate-500">Your next scheduled ride</p>
                </div>
              </div>
              <button type="button" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                View details
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-bold text-navy">
                  <RouteIcon size={16} className="text-brand" />
                  R-02 QC Hall ↔ Commonwealth
                </div>
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-green-700">
                  On time
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">From</p>
                    <p className="font-semibold text-navy">Quezon Memorial Circle</p>
                  </div>
                </div>

                <div className="flex items-center justify-center text-slate-400">
                  <ArrowRight size={18} />
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">To</p>
                    <p className="font-semibold text-navy">Commonwealth Avenue</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2"><Clock3 size={15} /> Today · 7:40 AM</span>
                <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-green-700" /> Safety check passed</span>
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-navy">Saved trips</h2>
                <p className="text-sm text-slate-500">Your frequent route patterns</p>
              </div>
              <button type="button" className="rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white">
                Add trip
              </button>
            </div>

            <div className="space-y-3">
              {upcomingTrips.map((trip) => (
                <div key={trip.route} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-navy">{trip.route}</p>
                      <p className="mt-1 text-xs text-slate-500">{trip.time}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                      trip.tone === 'green' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {trip.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
                    <span>{trip.from}</span>
                    <ArrowRight size={14} className="text-slate-400" />
                    <span>{trip.to}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Star size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black text-navy">Trip history</h3>
              </div>
            </div>

            <div className="space-y-3">
              {tripHistory.map((trip) => (
                <div key={`${trip.route}-${trip.date}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy">{trip.route}</p>
                      <p className="mt-1 text-xs text-slate-500">{trip.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand">{trip.fare}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-600">
                        <Star size={12} fill="currentColor" /> {trip.rating}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-lg font-black text-navy">Quick actions</h3>
            <div className="space-y-3">
              {[
                'View live tracking',
                'Plan another route',
                'Check timetable',
              ].map((action) => (
                <button
                  key={action}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-brand/30 hover:text-brand"
                >
                  <span>{action}</span>
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
