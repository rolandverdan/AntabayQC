import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import Button from '../components/Button.jsx'
import Field from '../components/FormField.jsx'
import { inputClass } from '../utils/ui.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useAdminData } from '../context/AdminDataContext.jsx'
import { ADMIN_USERNAMES, ADMIN_PASSWORD } from '../data/credentials.js'
import AuthShell, { FormFeedback } from '../../shared/components/AuthShell.jsx'
import useRoleSwitch from '../../shared/hooks/useRoleSwitch.js'

export default function Login() {
  const { user, login } = useAuth()
  const { addLog } = useAdminData()
  const signOutOthers = useRoleSwitch()
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null) // { type, text }
  const [busy, setBusy] = useState(false)

  if (user && !busy) return <Navigate to="/admin/dashboard" replace />

  const submit = (e) => {
    e.preventDefault()
    const next = {}
    if (!identifier.trim()) next.identifier = 'Enter your email or username.'
    if (!password) next.password = 'Enter your password.'
    else if (password.length < 6) next.password = 'Password must be at least 6 characters.'
    setErrors(next)
    if (Object.keys(next).length) {
      setFeedback({ type: 'error', text: 'Please fix the highlighted fields.' })
      return
    }
    const ok = ADMIN_USERNAMES.includes(identifier.trim().toLowerCase()) && password === ADMIN_PASSWORD
    if (!ok) {
      addLog({ action: 'Failed login attempt', module: 'Authentication', severity: 'Warning', description: 'Invalid credentials entered on the login form.' })
      setFeedback({ type: 'error', text: 'Incorrect email/username or password.' })
      return
    }
    setBusy(true)
    setFeedback({ type: 'success', text: 'Login successful. Redirecting to the dashboard…' })
    addLog({ action: 'Admin logged in', module: 'Authentication', description: 'Administrator signed in.' })
    setTimeout(() => {
      signOutOthers('admin')
      login(identifier.trim(), remember)
      const from = location.state?.from
      navigate(from && from.startsWith('/admin') ? from : '/admin/dashboard', { replace: true })
    }, 600)
  }

  return (
    <AuthShell
      role="Administrator portal"
      heading="Administrator Console"
      blurb="Manage buses, drivers, stops, and routes, and monitor operations, reports, and emergencies from one place."
      footer="Administrator portal"
    >
      <form onSubmit={submit} noValidate>
        <h1 className="text-2xl font-bold text-navy">Admin Login</h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">Sign in to manage the ANTABAY QC system.</p>

        <FormFeedback feedback={feedback} />

        <div className="space-y-4">
          <Field label="Email or username" required error={errors.identifier}>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" placeholder="admin@antabayqc.com" className={inputClass(errors.identifier)} />
          </Field>
          <Field label="Password" required error={errors.password}>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••" className={`${inputClass(errors.password)} pr-12`} />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded text-slate-500 hover:text-brand">
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>
          <label className="flex min-h-11 items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-brand" />
            Remember me on this browser
          </label>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</Button>
        </div>
      </form>
    </AuthShell>
  )
}
