import { useState } from 'react'
import { Lock, RotateCcw, Save } from 'lucide-react'
import { useAdminData } from '../context/AdminDataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Card, { PageHeader, Notice } from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import Field from '../components/FormField.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { inputClass } from '../utils/ui.js'

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2">
      <span><span className="block text-sm font-medium text-navy">{label}</span>{hint && <span className="block text-xs text-slate-500">{hint}</span>}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 shrink-0 accent-brand" />
    </label>
  )
}

export default function Settings() {
  const { settings, saveSettings, resetData } = useAdminData()
  const { notify } = useToast()
  const [draft, setDraft] = useState(settings)
  const [errors, setErrors] = useState({})
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [confirmReset, setConfirmReset] = useState(false)

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)
  const upd = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }))
  const updNotif = (k) => (v) => setDraft((d) => ({ ...d, notifications: { ...d.notifications, [k]: v } }))

  const save = (ev) => {
    ev.preventDefault()
    const e = {}
    if (!draft.name.trim()) e.name = 'Name is required.'
    if (!/^\S+@\S+\.\S+$/.test(draft.email)) e.email = 'Enter a valid email address.'
    if (draft.phone && !/^(\+63|0)9\d{9}$/.test(draft.phone.replace(/[\s-]/g, ''))) e.phone = 'Use a PH mobile number, e.g. 09171234567.'
    setErrors(e)
    if (Object.keys(e).length) return
    saveSettings({ ...draft, name: draft.name.trim(), email: draft.email.trim(), pageSize: Number(draft.pageSize) })
    notify('Settings saved in this browser.')
  }

  const changePassword = (ev) => {
    ev.preventDefault()
    const e = {}
    if (!pw.current) e.current = 'Enter your current password.'
    if (pw.next.length < 8) e.next = 'New password must be at least 8 characters.'
    if (pw.confirm !== pw.next) e.confirm = 'Passwords do not match.'
    setPwErrors(e)
    if (Object.keys(e).length) return
    setPw({ current: '', next: '', confirm: '' })
    notify('Password form validated.', 'info')
  }

  return (
    <>
      <PageHeader title="Settings" description="Administrator profile and preferences." />
      <Notice tone="blue">Settings are saved in this browser&apos;s local storage only. There is no server-side storage, and this is not secure storage.</Notice>

      <div className="grid gap-5 xl:grid-cols-3">
        <form onSubmit={save} noValidate className="space-y-5 xl:col-span-2">
          <Card title="Administrator profile">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required error={errors.name}><input className={inputClass(errors.name)} value={draft.name} onChange={upd('name')} /></Field>
              <Field label="Email" required error={errors.email}><input type="email" className={inputClass(errors.email)} value={draft.email} onChange={upd('email')} /></Field>
              <Field label="Contact number" error={errors.phone}><input className={inputClass(errors.phone)} value={draft.phone} onChange={upd('phone')} /></Field>
              <Field label="Role"><input className={inputClass(false)} value={draft.role} disabled /></Field>
            </div>
          </Card>

          <Card title="Notification preferences">
            <div className="divide-y divide-slate-100">
              <Toggle label="Emergency alerts" hint="Show active emergencies in the header bell." checked={draft.notifications.emergency} onChange={updNotif('emergency')} />
              <Toggle label="Pending report alerts" hint="Show pending reports in the header bell." checked={draft.notifications.reports} onChange={updNotif('reports')} />
              <Toggle label="System log notices" checked={draft.notifications.logs} onChange={updNotif('logs')} />
              <Toggle label="Email digest" hint="No emails are actually sent." checked={draft.notifications.emailDigest} onChange={updNotif('emailDigest')} />
            </div>
          </Card>

          <Card title="Dashboard & display">
            <div className="divide-y divide-slate-100">
              <Toggle label="Show map preview on dashboard" checked={draft.showMapPreview} onChange={(v) => setDraft((d) => ({ ...d, showMapPreview: v }))} />
              <Toggle label="Show recent activity cards" hint="Recent system, report, and emergency logs." checked={draft.showRecentActivity} onChange={(v) => setDraft((d) => ({ ...d, showRecentActivity: v }))} />
              <Toggle label="Collapse sidebar by default" hint="Icons only; expands when you hover over it. Turn off to keep it open. Applies on next sign in or reload." checked={draft.sidebarCollapsed} onChange={(v) => setDraft((d) => ({ ...d, sidebarCollapsed: v }))} />
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Table density"><select className={inputClass(false)} value={draft.density} onChange={upd('density')}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></Field>
              <Field label="Rows per table page"><select className={inputClass(false)} value={draft.pageSize} onChange={upd('pageSize')}>{[5, 8, 10, 15, 20].map((n) => <option key={n} value={n}>{n}</option>)}</select></Field>
            </div>
          </Card>

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" icon={RotateCcw} onClick={() => { setDraft(settings); setErrors({}) }} disabled={!dirty}>Reset / Cancel</Button>
            <Button type="submit" icon={Save} disabled={!dirty}>Save Changes</Button>
          </div>
        </form>

        <div className="space-y-5">
          <Card title="Change password">
            <form onSubmit={changePassword} noValidate className="space-y-3">
              <Field label="Current password" error={pwErrors.current}><input type="password" autoComplete="current-password" className={inputClass(pwErrors.current)} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
              <Field label="New password" error={pwErrors.next}><input type="password" autoComplete="new-password" className={inputClass(pwErrors.next)} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
              <Field label="Confirm new password" error={pwErrors.confirm}><input type="password" autoComplete="new-password" className={inputClass(pwErrors.confirm)} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
              <Button type="submit" variant="secondary" icon={Lock} className="w-full">Update password</Button>
            </form>
          </Card>

          <Card title="Reset data">
            <p className="mb-3 text-sm text-slate-600">Restore all buses, accounts, stops, routes, logs, reports, emergencies and settings to their original values.</p>
            <Button variant="danger" icon={RotateCcw} onClick={() => setConfirmReset(true)} className="w-full">Reset data</Button>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset} title="Reset all data?" confirmLabel="Reset data"
        message="Every record you added or changed in this browser will be replaced with the original values."
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => { resetData(); setConfirmReset(false); notify('Data restored.', 'info'); setTimeout(() => window.location.reload(), 600) }}
      />
    </>
  )
}
