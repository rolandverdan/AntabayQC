import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { IdCard, Bus, Phone, Mail, LogOut, Route as RouteIcon, Pencil, Info } from 'lucide-react'
import Card from '../../admin/components/Card.jsx'
import Button from '../../admin/components/Button.jsx'
import Modal from '../../admin/components/Modal.jsx'
import Field from '../../admin/components/FormField.jsx'
import { useConductor } from '../context/ConductorContext.jsx'
import { useCommuter } from '../../commuter/context/CommuterContext.jsx'
import { useToast } from '../../admin/context/ToastContext.jsx'
import { updateUserProfile } from '../../firebase/userProfiles.js'
import { getAuthErrorMessage } from '../../firebase/auth.js'

const inputCls = 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20'

function Item({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand"><Icon size={18} /></span>
      <div className="min-w-0">
        <dt className="text-xs leading-4 text-slate-500">{label}</dt>
        <dd className="break-words text-sm font-semibold leading-5 text-navy">{value}</dd>
      </div>
    </div>
  )
}

export default function AccountPage() {
  const { profile, updateProfile, session } = useConductor()
  const { userProfile } = useCommuter()
  const { notify } = useToast()
  const { requestLogout } = useOutletContext()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(profile)
  const [saving, setSaving] = useState(false)

  const accountProfile = session?.firebaseAuthenticated
    ? {
        ...profile,
        fullName: userProfile?.displayName || session.displayName || session.identifier,
        email: userProfile?.email || session.email || session.identifier,
        contact: userProfile?.phone || session.phone || '',
      }
    : profile
  const initials = accountProfile.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const open = () => { setForm(accountProfile); setEditing(true) }
  const save = async (e) => {
    e.preventDefault()
    const fullName = form.fullName.trim() || accountProfile.fullName
    const contact = form.contact.trim()
    setSaving(true)
    try {
      if (session?.firebaseAuthenticated && session.uid) {
        await updateUserProfile(session.uid, { displayName: fullName, phone: contact })
      }
      updateProfile({ fullName, contact, email: accountProfile.email })
      setEditing(false)
      notify(session?.firebaseAuthenticated ? 'Profile saved to your Firebase account.' : 'Profile updated for this session.', 'success')
    } catch (error) {
      notify(getAuthErrorMessage(error, 'save your profile'), 'error')
    } finally {
      setSaving(false)
    }
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="mx-auto max-w-3xl">
      {/* The top bar already shows "Account", so the profile card leads the page. */}
      <Card bodyClass="p-0">
        <div className="p-5">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-bold text-white" aria-hidden="true">{initials}</span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-navy">{accountProfile.fullName}</p>
              <p className="text-sm text-slate-500">Conductor</p>
            </div>
          </div>
          <Button icon={Pencil} onClick={open} className="mt-4 w-full">Edit profile</Button>
        </div>
        <dl className="divide-y divide-slate-100 border-t border-slate-100 px-5">
          <Item icon={IdCard} label="Conductor ID" value={profile.conductorId} />
          <Item icon={Bus} label="Assigned vehicle" value={profile.assignedVehicle} />
          <Item icon={RouteIcon} label="Assigned route" value={profile.assignedRoute} />
          <Item icon={Phone} label="Contact number" value={accountProfile.contact || 'Not provided'} />
          <Item icon={Mail} label="Email address" value={accountProfile.email} />
        </dl>
      </Card>

      <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 md:text-sm">
        <Info size={16} className="mt-0.5 shrink-0" />
        {session?.firebaseAuthenticated
          ? 'Your name, email and phone come from your Firebase account. Conductor ID, vehicle and route are sample assignments.'
          : 'Details are sample data. Edits stay in this session and reset when you log out.'}
      </p>

      {/* Phones and tablets have no sidebar, so Logout lives here (it still asks for confirmation). */}
      <div className="mt-4 lg:hidden">
        <Button variant="secondary" icon={LogOut} onClick={requestLogout} className="w-full text-red-600! hover:bg-red-50!">Log out</Button>
      </div>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit profile"
        size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
          <Button type="submit" form="edit-profile-form" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </>}
      >
        <form id="edit-profile-form" onSubmit={save} className="space-y-4">
          <Field label="Full name"><input className={inputCls} value={form.fullName} onChange={set('fullName')} /></Field>
          <Field label="Contact number"><input className={inputCls} value={form.contact} onChange={set('contact')} inputMode="tel" /></Field>
          <Field label="Email address"><input className={inputCls} type="email" value={accountProfile.email} readOnly /></Field>
          <p className="text-xs text-slate-500">Conductor ID, vehicle and route are assigned by operations and cannot be changed here.</p>
        </form>
      </Modal>
    </div>
  )
}
