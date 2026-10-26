import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Info } from 'lucide-react'
import Button from '../admin/components/Button.jsx'
import Field from '../admin/components/FormField.jsx'
import { inputClass } from '../admin/utils/ui.js'
import { useAuth } from '../admin/context/AuthContext.jsx'
import { useAdminData } from '../admin/context/AdminDataContext.jsx'
import { useConductor } from '../conductor/context/ConductorContext.jsx'
import { useCommuter } from '../commuter/context/CommuterContext.jsx'
import { ADMIN_USERNAMES, ADMIN_PASSWORD } from '../admin/data/credentials.js'
import { DEMO_USERNAMES as CONDUCTOR_USERNAMES, DEMO_PASSWORD as CONDUCTOR_PASSWORD } from '../conductor/data/mock.js'
import { COMMUTER_USERNAMES, COMMUTER_PASSWORD } from '../commuter/data/credentials.js'
import AuthShell, { FormFeedback } from '../shared/components/AuthShell.jsx'
import useRoleSwitch from '../shared/hooks/useRoleSwitch.js'

// ONE login for the whole system. Each account belongs to a role; the role decides where it lands.
const HOME = { admin: '/admin/dashboard', conductor: '/conductor/dashboard', commuter: '/commuter/home' }

function findRole(id, pw) {
  const name = id.trim().toLowerCase()
  if (ADMIN_USERNAMES.includes(name) && pw === ADMIN_PASSWORD) return 'admin'
  if (CONDUCTOR_USERNAMES.includes(name) && pw === CONDUCTOR_PASSWORD) return 'conductor'
  if (COMMUTER_USERNAMES.includes(name) && pw === COMMUTER_PASSWORD) return 'commuter'
  return null
}

export default function Login() {
  const admin = useAuth()
  const conductor = useConductor()
  const commuter = useCommuter()
  const { addLog } = useAdminData()
  const signOutOthers = useRoleSwitch()
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [busy, setBusy] = useState(false)

  if (!busy) {
    if (admin.user) return <Navigate to={HOME.admin} replace />
    if (conductor.session) return <Navigate to={HOME.conductor} replace />
    if (commuter.session) return <Navigate to={HOME.commuter} replace />
  }

  const finish = (role, signIn) => {
    signOutOthers(role)
    signIn()
    const from = location.state?.from
    navigate(from && from.startsWith(`/${role}`) ? from : HOME[role], { replace: true })
  }

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
    const role = findRole(identifier, password)
    if (!role) {
      addLog({ action: 'Failed login attempt', module: 'Authentication', severity: 'Warning', description: 'Invalid credentials entered on the login form.' })
      setFeedback({ type: 'error', text: 'Incorrect email/username or password.' })
      return
    }
    setBusy(true)
    setFeedback({ type: 'success', text: 'Login successful. Redirecting…' })
    const id = identifier.trim()
    setTimeout(() => {
      if (role === 'admin') {
        addLog({ action: 'Admin logged in', module: 'Authentication', description: 'Administrator signed in.' })
        finish(role, () => admin.login(id, remember))
      } else if (role === 'conductor') finish(role, () => conductor.login(id))
      else finish(role, () => commuter.enter('account', id))
    }, 600)
  }

  const guest = () => {
    setBusy(true)
    finish('commuter', () => commuter.enter('guest'))
  }

  return (
    <AuthShell
      role="Sign in"
      heading="Real-Time Bus Tracking for Quezon City"
      blurb="One sign-in for administrators, conductors, and commuters. Your account decides which side opens."
      footer="ANTABAY QC · frontend demo"
    >
      <form onSubmit={submit} noValidate>
        <h1 className="text-2xl font-bold text-navy">Login</h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">Sign in to ANTABAY QC.</p>

        <FormFeedback feedback={feedback} />

        <div className="space-y-4">
          <Field label="Email or username" required error={errors.identifier}>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" placeholder="Email or username" className={inputClass(errors.identifier)} />
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
          <Button type="button" variant="ghost" className="w-full" onClick={guest} disabled={busy}>Continue as guest commuter</Button>
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
          <Info size={14} className="mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <p className="font-semibold">Demo accounts (no real authentication)</p>
            <p>Admin: <span className="font-semibold">admin</span> / {ADMIN_PASSWORD}</p>
            <p>Conductor: <span className="font-semibold">lourdes.garcia</span> / {CONDUCTOR_PASSWORD}</p>
            <p>Commuter: <span className="font-semibold">commuter</span> / {COMMUTER_PASSWORD}</p>
          </div>
        </div>
      </form>
    </AuthShell>
  )
}
