import { ArrowRight, BusFront, MapPinned, ShieldCheck, Ticket, BellRing } from 'lucide-react'
import { Link } from 'react-router-dom'

const serviceCards = [
  { title: 'Routes', description: 'Browse available routes and trip schedules.', icon: Ticket },
  { title: 'Live Tracking', description: 'See bus activity and service updates.', icon: MapPinned },
  { title: 'Updates', description: 'Check announcements and service alerts.', icon: BellRing },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
              <BusFront size={20} />
            </div>
            <div>
              <p className="text-lg font-black tracking-wide text-navy">ANTABAY QC</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Commuter Service</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/login"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
            >
              Admin Portal
            </Link>
            <Link
              to="/commuter/home"
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
            >
              Commuter Portal
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h1 className="text-4xl font-black leading-tight text-navy lg:text-5xl">
                Ride better around Quezon City.
              </h1>
              <p className="mt-4 max-w-lg text-base text-slate-600 lg:text-lg">
                ANTABAY QC helps commuters check routes, schedules, updates, and city bus information in one place.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to="/commuter/home"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark"
                >
                  Commuter Portal <ArrowRight size={16} />
                </Link>
                <Link
                  to="/admin/login"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-brand hover:text-brand"
                >
                  Admin Portal
                </Link>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="rounded-[18px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-brand">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">City Service</p>
                    <p className="text-xl font-black text-navy">QC Bus</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2">
                    <span>Hours</span>
                    <span className="font-bold text-slate-800">6:00 AM – 9:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2">
                    <span>Routes</span>
                    <span className="font-bold text-slate-800">8 operating routes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          {serviceCards.map(({ title, description, icon: Icon }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-brand">
                <Icon size={22} />
              </div>
              <h3 className="text-xl font-bold text-navy">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
