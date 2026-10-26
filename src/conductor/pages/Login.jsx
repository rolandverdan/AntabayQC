import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Info } from 'lucide-react'
import Button from '../../admin/components/Button.jsx'
import Field from '../../admin/components/FormField.jsx'
import { inputClass } from '../../admin/utils/ui.js'
import { useConductor } from '../context/ConductorContext.jsx'
import { DEMO_USERNAMES, DEMO_PASSWORD } from '../data/mock.js'
import AuthShell, { FormFeedback } from '../../shared/components/AuthShell.jsx'
import useRoleSwitch from '../../shared/hooks/useRoleSwitch.js'

export default function Login() {
  const { session, login } = useConductor()
  const signOutOthers = useRoleSwitch()
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [busy, setBusy] = useState(false)

  if (session && !busy) return <Navigate to="/conductor/dashboard" replace />

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
    const ok = DEMO_USERNAMES.includes(identifier.trim().toLowerCase()) && password === DEMO_PASSWORD
    if (!ok) {
      setFeedback({ type: 'error', text: 'Incorrect email/username or password.' })
      return
    }
    setBusy(true)
    setFeedback({ type: 'success', text: 'Login successful. Opening your dashboard…' })
    setTimeout(() => {
      signOutOthers('conductor')
      login(identifier.trim())
      const from = location.state?.from
      navigate(from && from.startsWith('/conductor') ? from : '/conductor/dashboard', { replace: true })
    }, 600)
  }

  return (
    <AuthShell
      role="Conductor portal"
      heading="Conductor Console"
      blurb="Follow your route on the map, check the on-board cameras, and report an emergency from one screen."
      footer="Conductor portal · frontend demo"
    >
      <form onSubmit={submit} noValidate>
        <h1 className="text-2xl font-bold text-navy">Conductor Login</h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">Sign in to start your trip monitoring.</p>

        <FormFeedback feedback={feedback} />

        <div className="space-y-4">
          <Field label="Email or username" required error={errors.identifier}>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" placeholder="lourdes.garcia" className={inputClass(errors.identifier)} />
          </Field>
          <Field label="Password" required error={errors.password}>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••" className={`${inputClass(errors.password)} pr-12`} />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded text-slate-500 hover:text-brand">
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</Button>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
          <Info size={14} className="mt-0.5 shrink-0" />
          <p>
            Demo login only. Use <span className="font-semibold">lourdes.garcia</span> and password <span className="font-semibold">{DEMO_PASSWORD}</span>. No real authentication is used.
          </p>
        </div>
      </form>
    </AuthShell>
  )
}
