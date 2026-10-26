import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  MapPinned,
  MessageSquareText,
  Route as RouteIcon,
  Settings,
  UserRound,
  PackageSearch,
  PhoneCall,
} from 'lucide-react'
import { PageHeader } from '../../admin/components/Card.jsx'

const featureCards = [
  { title: 'Route and Schedule', subtitle: 'View bus routes, stops and schedule', icon: RouteIcon, href: '/commuter/route-and-schedule', tone: 'amber' },
  { title: 'Live Tracking', subtitle: 'See real-time bus locations', icon: MapPinned, href: '/commuter/live-tracking', tone: 'green' },
  { title: 'Lost Item', subtitle: 'Report or check lost items', icon: PackageSearch, href: '/commuter/lost-item', tone: 'yellow' },
  { title: 'My Trips', subtitle: 'View your commuter trip history and access saved trips', icon: UserRound, href: '/commuter/my-trip', tone: 'blue' },
]

const quickAccess = [
  { title: 'Report Incidents', subtitle: 'Report concerns or problems with QC Bus services.', icon: AlertTriangle, tone: 'red', href: '/commuter/report' },
  { title: 'Send Feedback', subtitle: 'Rate your experience and share suggestions.', icon: MessageSquareText, tone: 'blue', href: '/commuter/feedback' },
  { title: 'Settings', subtitle: 'Manage your account and preferences.', icon: Settings, tone: 'dark', href: '/commuter/settings' },
]

export default function CommuterHome() {
  return (
    <>
      <PageHeader title="Home" description="Your quick access to QC Bus routes, trips, and commuter services." />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="space-y-5 lg:col-span-2">
          <div className="h-52 overflow-hidden rounded-2xl bg-[#0d54b8] p-0 shadow-sm ring-1 ring-blue-900/10">
            <img
              src="/images/bus1.jpeg"
              alt="QC Bus"
              className="h-full w-full object-cover object-[center_70%]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {featureCards.map(({ title, subtitle, icon: Icon, href, tone }) => (
              <Link key={title} to={href} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    tone === 'amber' ? 'bg-yellow-100 text-yellow-700' :
                    tone === 'green' ? 'bg-green-100 text-green-700' :
                    tone === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-sky-100 text-sky-700'
                  }`}>
                    <Icon size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-navy">{title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:block">
            <h3 className="mb-4 text-lg font-bold text-navy">Quick Access</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {quickAccess.map(({ title, subtitle, icon: Icon, href, tone }) => (
                <Link key={title} to={href} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center transition hover:border-brand/30 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2">
                  <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${
                    tone === 'red' ? 'bg-red-500 text-white' :
                    tone === 'blue' ? 'bg-blue-600 text-white' :
                    'bg-[#0d54b8] text-white'
                  }`}>
                    <Icon size={28} />
                  </div>
                  <p className="text-base font-bold text-navy">{title}</p>
                  <p className="mt-2 text-sm leading-5 text-slate-500">{subtitle}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:block">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-700">
                <Bell size={16} className="text-slate-600" />
                <span className="text-base font-bold text-navy">Latest Updates</span>
              </div>
              <Link to="/commuter/notification" className="text-xs font-semibold text-brand hover:underline">view all</Link>
            </div>
            <p className="mb-3 text-xs text-slate-500">Sample advisories for preview only — not current service alerts.</p>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span className="text-lg text-blue-500">⛅</span>
                  Sample weather advisory
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span className="text-lg text-red-500">⚠</span>
                  Sample traffic advisory
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-brand p-5 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <PhoneCall size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold">QC LGU Hotline</h3>
                <p className="mt-1 text-sm text-blue-100">For emergency assistance</p>
              </div>
            </div>
            <a
              href="tel:122"
              className="mt-5 flex items-center justify-between rounded-xl bg-white px-4 py-3 text-brand transition hover:bg-blue-50"
            >
              <span className="text-sm font-semibold">Call hotline</span>
              <span className="text-xl font-bold">122</span>
            </a>
          </div>
        </aside>
      </div>
    </>
  )
}
