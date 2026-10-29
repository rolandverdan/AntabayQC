import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Info, UserRound } from 'lucide-react'
import Button from '../../admin/components/Button.jsx'
import Field from '../../admin/components/FormField.jsx'
import { inputClass } from '../../admin/utils/ui.js'
import { useCommuter } from '../context/CommuterContext.jsx'
import { COMMUTER_USERNAMES, COMMUTER_PASSWORD } from '../data/credentials.js'
import AuthShell, { FormFeedback } from '../../shared/components/AuthShell.jsx'
import useRoleSwitch from '../../shared/hooks/useRoleSwitch.js'

export default function Access() {
  const { session, enter } = useCommuter()
  const signOutOthers = useRoleSwitch()
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [busy, setBusy] = useState(false)

  if (session && !busy) return <Navigate to={session.mode === 'guest' ? '/commuter/live-tracking' : '/commuter/home'} replace />

  const go = (mode, id) => {
    setBusy(true)
    signOutOthers('commuter')
    enter(mode, id)
    const from = location.state?.from
    const home = mode === 'guest' ? '/commuter/live-tracking' : '/commuter/home'
    navigate(mode !== 'guest' && from && from.startsWith('/commuter') ? from : home, { replace: true })
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
    const ok = COMMUTER_USERNAMES.includes(identifier.trim().toLowerCase()) && password === COMMUTER_PASSWORD
    if (!ok) {
      setFeedback({ type: 'error', text: 'Incorrect email/username or password.' })
      return
    }
    setFeedback({ type: 'success', text: 'Signed in. Opening the commuter app…' })
    go('account', identifier.trim())
  }

  return (
    <AuthShell
      role="Commuter app"
      heading="Ride better around Quezon City"
      blurb="Check bus routes, stops, timetables, and trip updates. No account is needed to look around."
      footer="Commuter portal · frontend demo"
    >
      <h1 className="text-xl font-bold text-navy">Commuter Access</h1>
      <p className="mb-4 mt-1 text-sm text-slate-500">Continue as a guest, or sign in with a demo commuter account.</p>

      <Button type="button" className="w-full" icon={ArrowRight} onClick={() => go('guest')} disabled={busy}>Continue as guest</Button>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400" aria-hidden="true">
        <span className="h-px flex-1 bg-slate-200" /> or sign in <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={submit} noValidate>
        <FormFeedback feedback={feedback} />
        <div className="space-y-4">
          <Field label="Email or username" error={errors.identifier}>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" placeholder="commuter" className={inputClass(errors.identifier)} />
          </Field>
          <Field label="Password" error={errors.password}>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••" className={`${inputClass(errors.password)} pr-12`} />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded text-slate-500 hover:text-brand">
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>
          <Button type="submit" variant="secondary" className="w-full" icon={UserRound} disabled={busy}>Sign in</Button>
        </div>
      </form>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
        <Info size={14} className="mt-0.5 shrink-0" />
        <p>
          Demo only. Use <span className="font-semibold">commuter</span> and password <span className="font-semibold">{COMMUTER_PASSWORD}</span>, or just continue as a guest. No real authentication is used.
        </p>
      </div>
    </AuthShell>
  )
}
