import { useState } from 'react'
import { Lock, RotateCcw, Save, Check } from 'lucide-react'
import { useAdminData } from '../context/AdminDataContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Card, { PageHeader, Notice } from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import Field from '../components/FormField.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import PasswordInput from '../components/PasswordInput.jsx'
import { PASSWORD_RULES } from '../components/FormParts.jsx'
import { inputClass } from '../utils/ui.js'

function Toggle({ label, hint, checked, onChange, className = '' }) {
  return (
    <label className={`flex cursor-pointer items-center justify-between gap-4 px-4 py-3 ${className}`}>
      <span className="min-w-0"><span className="block text-sm font-semibold text-navy">{label}</span>{hint && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 shrink-0 accent-brand" />
    </label>
  )
}

const STRENGTH_LABELS = ['—', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLORS = ['bg-slate-200', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-green-600']

function Rule({ ok, children }) {
  return (
    <li className={`flex items-center gap-2 text-xs ${ok ? 'font-medium text-green-700' : 'text-slate-600'}`}>
      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${ok ? 'border-green-600 bg-green-600 text-white' : 'border-slate-300 bg-white'}`}>{ok && <Check size={10} strokeWidth={3} />}</span>
      {children}<span className="sr-only">{ok ? '(met)' : '(not met)'}</span>
    </li>
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

  const ruleResults = PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(pw.next) }))
  const differs = !!pw.next && pw.next !== pw.current
  const matches = !!pw.confirm && pw.confirm === pw.next
  const rulesOk = ruleResults.every((r) => r.ok) && differs
  const strength = pw.next ? ruleResults.filter((r) => r.ok).length : 0
  const canUpdate = !!pw.current && rulesOk && matches

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
    if (!rulesOk) e.next = 'New password does not meet all the requirements.'
    if (pw.confirm !== pw.next) e.confirm = 'Passwords do not match.'
    setPwErrors(e)
    if (Object.keys(e).length) return
    setPw({ current: '', next: '', confirm: '' })
    notify('Password updated.', 'info')
  }

  return (
    <>
      <PageHeader title="Settings" description="Administrator profile and preferences." />
      <Notice tone="blue">Settings are saved in this browser&apos;s local storage only. There is no server-side storage, and this is not secure storage.</Notice>

      <div className="grid items-start gap-4 xl:grid-cols-3">
        <form onSubmit={save} noValidate className="space-y-4 xl:col-span-2">
          <Card title="Administrator profile" bodyClass="p-4">
            <div className="grid gap-x-4 gap-y-3.5 sm:grid-cols-2">
              <Field label="Full name" required error={errors.name}><input className={inputClass(errors.name)} value={draft.name} onChange={upd('name')} /></Field>
              <Field label="Email" required error={errors.email}><input type="email" className={inputClass(errors.email)} value={draft.email} onChange={upd('email')} /></Field>
              <Field label="Contact number" error={errors.phone}><input className={inputClass(errors.phone)} value={draft.phone} onChange={upd('phone')} /></Field>
              <Field label="Role"><input className={inputClass(false)} value={draft.role} disabled /></Field>
            </div>
          </Card>

          <Card
            title="Notification preferences"
            bodyClass="p-0"
            footer={<>
              <Button variant="secondary" icon={RotateCcw} onClick={() => { setDraft(settings); setErrors({}) }} disabled={!dirty}>Reset / Cancel</Button>
              <Button type="submit" icon={Save} disabled={!dirty}>Save Changes</Button>
            </>}
          >
            <div className="grid sm:grid-cols-2">
              <Toggle className="border-b border-slate-100 sm:border-r" label="Emergency alerts" hint="Show active emergencies in the header bell." checked={draft.notifications.emergency} onChange={updNotif('emergency')} />
              <Toggle className="border-b border-slate-100" label="Pending report alerts" hint="Show pending reports in the header bell." checked={draft.notifications.reports} onChange={updNotif('reports')} />
              <Toggle className="border-b border-slate-100 sm:border-b-0 sm:border-r" label="System log notices" hint="Show new system log entries in the header bell." checked={draft.notifications.logs} onChange={updNotif('logs')} />
              <Toggle label="Email digest" hint="No emails are actually sent." checked={draft.notifications.emailDigest} onChange={updNotif('emailDigest')} />
            </div>
          </Card>
        </form>

        <Card title="Change password" bodyClass="p-4">
          <form onSubmit={changePassword} noValidate className="space-y-3.5">
            <Field label="Current password" required error={pwErrors.current}><PasswordInput autoComplete="current-password" className={inputClass(pwErrors.current)} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
            <div>
              <Field label="New password" required error={pwErrors.next}><PasswordInput autoComplete="new-password" className={inputClass(pwErrors.next)} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
              <div className="mt-2" aria-live="polite">
                <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
                  {[1, 2, 3, 4].map((n) => <span key={n} className={`h-1.5 rounded-full ${strength >= n ? STRENGTH_COLORS[strength] : 'bg-slate-200'}`} />)}
                </div>
                <p className="mt-1.5 flex justify-between text-xs text-slate-500"><span>Password strength</span><span className="font-semibold text-navy">{STRENGTH_LABELS[strength]}</span></p>
              </div>
            </div>
            <Field label="Confirm new password" required error={pwErrors.confirm}><PasswordInput autoComplete="new-password" className={inputClass(pwErrors.confirm)} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold text-navy">Password requirements</p>
              <ul className="space-y-1.5">
                {ruleResults.map((r) => <Rule key={r.id} ok={r.ok}>{r.label}</Rule>)}
                <Rule ok={differs}>Different from current password</Rule>
                <Rule ok={matches}>Matches confirmation</Rule>
              </ul>
            </div>
            <Button type="submit" icon={Lock} className="w-full" disabled={!canUpdate}>Update password</Button>
          </form>
        </Card>
      </div>

      {/* Danger zone: full width, at the bottom, and visually quieter than the primary actions above. */}
      <Card title="Reset data" titleClass="text-red-600" className="mt-4 border-red-300" bodyClass="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-3xl text-sm text-slate-600">Restore all buses, accounts, stops, routes, logs, reports, emergencies and settings to their original values. This can&apos;t be undone.</p>
        <Button variant="secondary" icon={RotateCcw} onClick={() => setConfirmReset(true)} className="shrink-0 border-red-500! text-red-600! hover:bg-red-50!">Reset data</Button>
      </Card>

      <ConfirmDialog
        open={confirmReset} title="Reset all data?" confirmLabel="Reset data"
        message="Every record you added or changed in this browser will be replaced with the original values."
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => { resetData(); setConfirmReset(false); notify('Data restored.', 'info'); setTimeout(() => window.location.reload(), 600) }}
      />
    </>
  )
}
