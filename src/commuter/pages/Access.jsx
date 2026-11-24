import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, UserRound } from 'lucide-react'
import Button from '../../admin/components/Button.jsx'
import Field from '../../admin/components/FormField.jsx'
import { inputClass } from '../../admin/utils/ui.js'
import { useCommuter } from '../context/CommuterContext.jsx'
import AuthShell, { FormFeedback } from '../../shared/components/AuthShell.jsx'
import useRoleSwitch from '../../shared/hooks/useRoleSwitch.js'
import { getAuthErrorMessage, signInWithEmail } from '../../firebase/auth.js'

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

  const go = async (mode, id) => {
    setBusy(true)
    try {
      await signOutOthers('commuter')
      enter(mode, id)
      const from = location.state?.from
      const home = mode === 'guest' ? '/commuter/live-tracking' : '/commuter/home'
      navigate(mode !== 'guest' && from && from.startsWith('/commuter') ? from : home, { replace: true })
    } catch (error) {
      setBusy(false)
      setFeedback({ type: 'error', text: getAuthErrorMessage(error, 'continue') })
    }
  }

  const submit = async (e) => {
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
    setBusy(true)
    try {
      const { user, role } = await signInWithEmail(identifier, password)
      if (role !== 'commuter') {
        setFeedback({ type: 'error', text: 'This account is not registered as a commuter.' })
        setBusy(false)
        return
      }
      await signOutOthers('commuter', { preserveFirebaseAuth: true })
      enter('account', user.email || user.uid, true, role)
      setFeedback({ type: 'success', text: 'Signed in. Opening the commuter app…' })
      navigate(location.state?.from?.startsWith('/commuter') ? location.state.from : '/commuter/home', { replace: true })
    } catch (error) {
      setBusy(false)
      setFeedback({ type: 'error', text: getAuthErrorMessage(error) })
    }
  }

  return (
    <AuthShell
      role="Commuter app"
      heading="Ride better around Quezon City"
      blurb="Check bus routes, stops, timetables, and trip updates. No account is needed to look around."
      footer="ANTABAY QC · Quezon City"
    >
      <h1 className="text-xl font-bold text-navy">Commuter Access</h1>
      <p className="mb-4 mt-1 text-sm text-slate-500">Continue as a guest, or sign in with your registered commuter account.</p>

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

    </AuthShell>
  )
}
