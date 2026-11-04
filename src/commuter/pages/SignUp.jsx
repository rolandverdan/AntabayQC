import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import Button from '../../admin/components/Button.jsx'
import Field from '../../admin/components/FormField.jsx'
import { PasswordChecklist, passwordMeetsRules } from '../../admin/components/FormParts.jsx'
import { inputClass } from '../../admin/utils/ui.js'
import { useCommuter } from '../context/CommuterContext.jsx'
import { saveCommuterProfile } from '../data/accounts.js'
import { getAuthErrorMessage, registerWithEmail } from '../../firebase/auth.js'
import AuthShell, { FormFeedback } from '../../shared/components/AuthShell.jsx'
import useRoleSwitch from '../../shared/hooks/useRoleSwitch.js'

export default function SignUp() {
  const { session, enter } = useCommuter()
  const signOutOthers = useRoleSwitch()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', agree: false })
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [busy, setBusy] = useState(false)

  // Guests may open this page (that is the point); anyone already signed in as a commuter goes home.
  if (session?.mode === 'account' && !busy) return <Navigate to="/commuter/home" replace />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Enter your full name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (form.phone && !/^(\+63|0)9\d{9}$/.test(form.phone.replace(/[\s-]/g, ''))) next.phone = 'Use a PH mobile number, e.g. 09171234567.'
    if (!passwordMeetsRules(form.password)) next.password = 'Password does not meet all the requirements.'
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match.'
    if (!form.agree) next.agree = 'Please accept the terms to continue.'
    setErrors(next)
    if (Object.keys(next).length) {
      setFeedback({ type: 'error', text: 'Please fix the highlighted fields.' })
      return
    }
    setBusy(true)
    try {
      const user = await registerWithEmail(form)
      saveCommuterProfile({ ...form, email: user.email || form.email })
      await signOutOthers('commuter', { preserveFirebaseAuth: true })
      enter('account', user.email || form.email, true)
      setFeedback({ type: 'success', text: 'Account created. Opening the commuter app…' })
      navigate('/commuter/home', { replace: true })
    } catch (error) {
      setBusy(false)
      setFeedback({ type: 'error', text: getAuthErrorMessage(error, 'create your account') })
    }
  }

  return (
    <AuthShell
      role="Commuter sign up"
      heading="Ride better around Quezon City"
      blurb="Create a free commuter account to save trips, get notifications, view timetables and report lost items."
      footer="ANTABAY QC · Quezon City"
    >
      <form onSubmit={submit} noValidate>
        <h1 className="text-2xl font-bold text-navy">Sign up</h1>
        <p className="mb-4 mt-1 text-sm text-slate-500">Create your commuter account.</p>
        <FormFeedback feedback={feedback} />

        <div className="space-y-3.5">
          <Field label="Full name" required error={errors.name}><input className={inputClass(errors.name)} value={form.name} onChange={set('name')} autoComplete="name" placeholder="Juan Dela Cruz" /></Field>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Email" required error={errors.email}><input type="email" className={inputClass(errors.email)} value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@email.com" /></Field>
            <Field label="Mobile number" error={errors.phone}><input className={inputClass(errors.phone)} value={form.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" placeholder="09171234567 (optional)" /></Field>
          </div>
          <Field label="Password" required error={errors.password}>
            <div className="relative">
              <input type={show ? 'text' : 'password'} className={`${inputClass(errors.password)} pr-12`} value={form.password} onChange={set('password')} autoComplete="new-password" placeholder="Create a password" />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded text-slate-500 hover:text-brand">
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>
          <Field label="Confirm password" required error={errors.confirm}>
            <input type={show ? 'text' : 'password'} className={inputClass(errors.confirm)} value={form.confirm} onChange={set('confirm')} autoComplete="new-password" placeholder="Re-enter your password" />
          </Field>
          <PasswordChecklist password={form.password} />
          <div>
            <label className="flex items-start gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={form.agree} onChange={set('agree')} className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-brand" />
              <span>I agree to the Terms &amp; Conditions and Privacy Policy of ANTABAY QC.</span>
            </label>
            {errors.agree && <p className="mt-1 text-xs font-medium text-red-600">{errors.agree}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</Button>
        </div>

        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account? <Link to="/" className="font-semibold text-brand hover:underline">Log in</Link>
        </p>
        {session?.mode === 'guest' && (
          <p className="mt-1 text-center text-xs text-slate-500"><Link to="/commuter/live-tracking" className="hover:underline">Back to guest live tracking</Link></p>
        )}
      </form>
    </AuthShell>
  )
}
