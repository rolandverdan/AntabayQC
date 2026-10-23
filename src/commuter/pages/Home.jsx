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
  Shield,
} from 'lucide-react'
import { PageHeader } from '../../admin/components/Card.jsx'
import Card from '../../admin/components/Card.jsx'
import Button from '../../admin/components/Button.jsx'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'

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
  const { buses, routes } = useAdminData()
  const activeBuses = buses.filter((b) => b.status === 'Active').length
  const activeRoutes = routes.filter((r) => r.status === 'Active').length

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <PageHeader title="Home" description="" />
        <Link
          to="/admin/login"
          className="inline-flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
        >
          <Shield size={15} />
          Admin Login
        </Link>
      </div>

      <div className="space-y-5">
        <div className="grid gap-5 md:grid-cols-[1.45fr_0.75fr]">
          <div className="h-52 overflow-hidden rounded-2xl bg-[#0d54b8] p-0 shadow-sm ring-1 ring-blue-900/10">
            <img
              src="/images/quezon-memorial-circle.png"
              alt="Quezon Memorial Circle"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-700">
                <Bell size={16} className="text-slate-600" />
                <span className="text-base font-bold text-navy">Latest Updates</span>
              </div>
              <Link to="/commuter/notification" className="text-xs font-semibold text-brand hover:underline">view all</Link>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span className="text-lg text-blue-500">⛅</span>
                  Weather Advisory
                </div>
                <p className="text-xs text-slate-500">Today, Oct 09, 2026</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span className="text-lg text-red-500">⚠</span>
                  Traffic Advisory
                </div>
                <p className="text-xs text-slate-500">Today, Oct 09, 2026</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {featureCards.map(({ title, subtitle, icon: Icon, href, tone }) => (
            <Link key={title} to={href} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  tone === 'amber' ? 'bg-yellow-100 text-yellow-700' :
                  tone === 'green' ? 'bg-green-100 text-green-700' :
                  tone === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-sky-100 text-sky-700'
                }`}>
                  <Icon size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-2xl font-bold text-navy">{title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-4 text-xl font-bold text-navy">Quick Access</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {quickAccess.map(({ title, subtitle, icon: Icon, href, tone }) => (
              <Link key={title} to={href} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center transition hover:border-brand/30 hover:bg-white">
                <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${
                  tone === 'red' ? 'bg-red-500 text-white' :
                  tone === 'blue' ? 'bg-blue-600 text-white' :
                  'bg-[#0d54b8] text-white'
                }`}>
                  <Icon size={28} />
                </div>
                <p className="text-lg font-bold text-navy">{title}</p>
                <p className="mt-2 text-sm leading-5 text-slate-500">{subtitle}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
