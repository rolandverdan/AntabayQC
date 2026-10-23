import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Bus, CircleAlert, CircleCheck, Eye, EyeOff } from 'lucide-react'
import Button from '../components/Button.jsx'
import Field from '../components/FormField.jsx'
import { inputClass } from '../utils/ui.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useAdminData } from '../context/AdminDataContext.jsx'
import { ADMIN_USERNAMES, ADMIN_PASSWORD } from '../data/credentials.js'

export default function Login() {
  const { user, login } = useAuth()
  const { addLog } = useAdminData()
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
      login(identifier.trim(), remember)
      navigate(location.state?.from || '/admin/dashboard', { replace: true })
    }, 600)
  }

  // Blue-toned silhouette of the provided photo: grayscale + luminosity blend over the brand blue, faded at the edges.
  const silhouette = 'pointer-events-none select-none object-cover object-center grayscale contrast-125 mix-blend-luminosity'
  const fade = { maskImage: 'linear-gradient(to bottom, transparent 0%, #000 25%, #000 75%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 25%, #000 75%, transparent 100%)' }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand p-10 text-white lg:flex">
        <img
          src="/images/quezon-memorial-circle.png"
          alt=""
          aria-hidden="true"
          style={fade}
          className={`absolute inset-0 h-full w-full opacity-60 ${silhouette}`}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand/40 to-brand/70" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand"><Bus size={24} /></div>
          <div>
            <p className="text-lg font-bold tracking-wide">ANTABAY QC</p>
            <p className="text-xs text-blue-200">GIS-based Bus Tracking · Quezon City</p>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold leading-tight">Administrator Console</h2>
          <p className="mt-3 max-w-md text-sm text-blue-100">
            Manage buses, drivers, stops, and routes, and monitor operations, reports, and emergencies from one place.
          </p>
        </div>
        <p className="relative z-10 text-xs text-blue-200">Administrator portal</p>
      </div>

      <div className="relative flex items-center justify-center overflow-hidden bg-brand p-6 lg:bg-surface">
        {/* Tablet / mobile: the same silhouette sits softly behind the form; hidden on desktop where it has its own panel. */}
        <img
          src="/images/quezon-memorial-circle.png"
          alt=""
          aria-hidden="true"
          style={fade}
          className={`absolute inset-0 h-full w-full opacity-40 lg:hidden ${silhouette}`}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand/60 to-brand-dark/80 lg:hidden" />
        <form onSubmit={submit} noValidate className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8 lg:shadow-sm">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white"><Bus size={22} /></div>
            <p className="font-bold text-navy">ANTABAY QC</p>
          </div>
          <h1 className="text-2xl font-bold text-navy">Admin Login</h1>
          <p className="mb-5 mt-1 text-sm text-slate-500">Sign in to manage the ANTABAY QC system.</p>

          {feedback && (
            <div role="alert" className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${feedback.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
              {feedback.type === 'error' ? <CircleAlert size={16} /> : <CircleCheck size={16} />}
              {feedback.text}
            </div>
          )}

          <div className="space-y-4">
            <Field label="Email or username" required error={errors.identifier}>
              <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" placeholder="admin@antabayqc.com" className={inputClass(errors.identifier)} />
            </Field>
            <Field label="Password" required error={errors.password}>
              <div className="relative">
                <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••" className={`${inputClass(errors.password)} pr-10`} />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-brand">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-brand" />
              Remember me on this browser
            </label>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
