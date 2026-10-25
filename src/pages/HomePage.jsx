import { Link } from 'react-router-dom'
import { ArrowRight, BusFront, LayoutDashboard, MapPinned, Monitor, Smartphone } from 'lucide-react'
import BrandBackdrop from '../shared/components/BrandBackdrop.jsx'
import Logo from '../shared/components/Logo.jsx'

const ROLES = [
  {
    to: '/login/admin',
    title: 'Admin',
    icon: LayoutDashboard,
    description: 'Manage buses, driver and conductor accounts, bus stops, routes, system logs, reports, and emergencies.',
    cta: 'Admin login',
    device: 'Best on laptop or desktop',
    deviceIcon: Monitor,
  },
  {
    to: '/login/conductor',
    title: 'Conductor',
    icon: BusFront,
    description: 'Follow your route on the map, check on-board cameras, manage trip settings, and send an SOS report.',
    cta: 'Conductor login',
    device: 'Made for smartphones',
    deviceIcon: Smartphone,
  },
  {
    to: '/login/commuter',
    title: 'User / Commuter',
    icon: MapPinned,
    description: 'Find bus routes, view bus stops and timetables, track buses, and check trip updates. Guests are welcome.',
    cta: 'Continue as commuter',
    device: 'Made for smartphones',
    deviceIcon: Smartphone,
  },
]

export default function HomePage() {
  return (
    <div className="mobile-ui relative min-h-dvh overflow-hidden bg-brand text-white">
      <BrandBackdrop opacity="opacity-50" overlay="bg-gradient-to-b from-brand/70 via-brand/60 to-brand-dark/90" />

      <div className="pt-safe pb-safe relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-center gap-3 py-6 lg:justify-start">
          <span className="flex h-16 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-lg sm:h-[72px] sm:w-16">
            <Logo className="h-full w-full" />
          </span>
          <div className="leading-tight">
            <p className="text-xl font-black tracking-wide sm:text-2xl">ANTABAY QC</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-blue-200">Quezon City</p>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center pb-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">ANTABAY QC</h1>
            <p className="mt-3 text-base font-medium text-blue-100 sm:text-lg">
              Real-Time Bus Tracking and Passenger Information System for Quezon City
            </p>
            <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-white/90">
              Choose your role to access ANTABAY QC.
            </p>
          </div>

          <nav aria-label="Choose your role" className="mt-6 grid gap-4 md:grid-cols-3">
            {ROLES.map(({ to, title, icon: Icon, description, cta, device, deviceIcon: DeviceIcon }) => (
              <Link
                key={to}
                to={to}
                className="group flex min-h-[44px] flex-col rounded-2xl border border-white/20 bg-white p-5 text-slate-700 shadow-xl outline-none transition focus-visible:ring-4 focus-visible:ring-white/70 [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand transition group-hover:bg-brand group-hover:text-white group-focus-visible:bg-brand group-focus-visible:text-white">
                    <Icon size={24} />
                  </span>
                  <h2 className="text-xl font-bold text-navy">{title}</h2>
                </div>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{description}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <DeviceIcon size={14} aria-hidden="true" /> {device}
                </p>
                <span className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-brand-dark">
                  {cta} <ArrowRight size={16} />
                </span>
              </Link>
            ))}
          </nav>
        </main>
      </div>
    </div>
  )
}
