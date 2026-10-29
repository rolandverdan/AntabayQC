import { useOutletContext } from 'react-router-dom'
import { Lock, IdCard, Bus, Phone, Mail, LogOut, Route as RouteIcon } from 'lucide-react'
import Card, { PageHeader, Notice } from '../../admin/components/Card.jsx'
import Button from '../../admin/components/Button.jsx'
import { useConductor } from '../context/ConductorContext.jsx'

function Item({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand"><Icon size={18} /></span>
      <div className="min-w-0">
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="break-words text-sm font-semibold text-navy">{value}</dd>
      </div>
    </div>
  )
}

export default function AccountPage() {
  const { profile } = useConductor()
  const { requestLogout } = useOutletContext()

  const initials = profile.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Account" description="Your conductor profile." />
      {/* Read-only on purpose: conductor details are managed by the administrator. */}
      <Notice tone="blue" icon={Lock}>
        Profile details are managed by your administrator and can't be edited here. To update your name, contact number or email, please contact operations.
      </Notice>

      <Card bodyClass="p-0">
        <div className="flex items-center gap-4 border-b border-slate-100 p-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-bold text-white" aria-hidden="true">{initials}</span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-navy">{profile.fullName}</p>
            <p className="text-sm text-slate-500">Conductor</p>
          </div>
        </div>
        <dl className="grid grid-cols-1 divide-y divide-slate-100 px-5 sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0">
          <Item icon={IdCard} label="Conductor ID" value={profile.conductorId} />
          <Item icon={Bus} label="Assigned vehicle" value={profile.assignedVehicle} />
          <Item icon={RouteIcon} label="Assigned route" value={profile.assignedRoute} />
          <Item icon={Phone} label="Contact number" value={profile.contact} />
          <Item icon={Mail} label="Email address" value={profile.email} />
        </dl>
      </Card>

      {/* Phones and tablets have no sidebar, so Logout lives here (it still asks for confirmation). */}
      <div className="mt-4 lg:hidden">
        <Button variant="secondary" icon={LogOut} onClick={requestLogout} className="w-full text-red-600! hover:bg-red-50!">Log out</Button>
      </div>
    </div>
  )
}
