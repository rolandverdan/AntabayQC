import { useState } from 'react'
import { Pencil, Info, IdCard, Bus, Phone, Mail, Route as RouteIcon } from 'lucide-react'
import Card, { PageHeader, Notice } from '../../admin/components/Card.jsx'
import Button from '../../admin/components/Button.jsx'
import Modal from '../../admin/components/Modal.jsx'
import Field from '../../admin/components/FormField.jsx'
import { inputClass } from '../../admin/utils/ui.js'
import { useConductor } from '../context/ConductorContext.jsx'
import { useToast } from '../../admin/context/ToastContext.jsx'

const PH_MOBILE = /^(09|\+639)\d{9}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  const { profile, updateProfile } = useConductor()
  const { notify } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(profile)
  const [errors, setErrors] = useState({})

  const initials = profile.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  const openEdit = () => { setForm(profile); setErrors({}); setOpen(true) }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = (e) => {
    e?.preventDefault()
    const next = {}
    if (!form.fullName.trim()) next.fullName = 'Enter your full name.'
    if (!PH_MOBILE.test(form.contact.replace(/[\s-]/g, ''))) next.contact = 'Use a PH mobile number, e.g. 09181234567.'
    if (!EMAIL.test(form.email.trim())) next.email = 'Enter a valid email address.'
    setErrors(next)
    if (Object.keys(next).length) return
    updateProfile({ fullName: form.fullName.trim(), contact: form.contact.replace(/[\s-]/g, ''), email: form.email.trim() })
    setOpen(false)
    notify('Profile updated (sample data, not saved to a server).', 'success')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Account" description="Your conductor profile." actions={<Button icon={Pencil} onClick={openEdit}>Edit profile</Button>} />
      <Notice tone="amber" icon={Info}>All details on this page are sample data. Edits stay on this device and reset when you log out.</Notice>

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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Edit profile"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save changes</Button>
          </>
        }
      >
        <form onSubmit={save} noValidate className="space-y-4">
          <Field label="Full name" required error={errors.fullName}>
            <input value={form.fullName} onChange={set('fullName')} autoComplete="name" className={inputClass(errors.fullName)} />
          </Field>
          <Field label="Contact number" required error={errors.contact}>
            <input value={form.contact} onChange={set('contact')} inputMode="tel" autoComplete="tel" className={inputClass(errors.contact)} />
          </Field>
          <Field label="Email address" required error={errors.email}>
            <input type="email" value={form.email} onChange={set('email')} autoComplete="email" className={inputClass(errors.email)} />
          </Field>
          <Field label="Conductor ID" hint="Assigned by the administrator.">
            <input value={form.conductorId} disabled className={inputClass()} />
          </Field>
          <Field label="Assigned vehicle" hint="Assigned by the administrator.">
            <input value={form.assignedVehicle} disabled className={inputClass()} />
          </Field>
          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
        </form>
      </Modal>
    </div>
  )
}
