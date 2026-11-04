import { useState } from 'react'
import {
  Bell,
  ChevronRight,
  Lock,
  Moon,
  Palette,
  ShieldCheck,
  Smartphone,
  UserRound,
} from 'lucide-react'
import { PageHeader } from '../../admin/components/Card.jsx'
import Button from '../../admin/components/Button.jsx'
import Modal from '../../admin/components/Modal.jsx'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'
import { useToast } from '../../admin/context/ToastContext.jsx'
import Select from '../../shared/components/Select.jsx'
import { useCommuter } from '../context/CommuterContext.jsx'
import { updateUserProfile } from '../../firebase/userProfiles.js'
import { getAuthErrorMessage } from '../../firebase/auth.js'

const SETTINGS_KEY = 'antabayqc_commuter_settings'
const SETTINGS_UPDATED_EVENT = 'antabayqc:commuter-settings-updated'

const defaults = {
  profile: {
    name: '',
    email: '',
    phone: '',
    routePreference: 'R-02',
  },
  alerts: { service: true, safety: true, route: true, report: false },
  preferences: { darkMode: false, compactView: false, useLocation: true, soundAlerts: true },
}

function readSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (!stored) return defaults
    const parsed = JSON.parse(stored)
    return {
      profile: { ...defaults.profile, ...parsed.profile },
      alerts: { ...defaults.alerts, ...parsed.alerts },
      preferences: { ...defaults.preferences, ...parsed.preferences },
    }
  } catch {
    return defaults
  }
}

function ToggleRow({ label, hint, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <div>
        <p className="text-sm font-semibold text-navy">{label}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="h-4 w-4 accent-brand"
      />
    </label>
  )
}

export default function Settings() {
  const { routes } = useAdminData()
  const { notify } = useToast()
  const { userProfile, session } = useCommuter()
  const [savedSettings, setSavedSettings] = useState(readSettings)
  const [profileDraft, setProfileDraft] = useState({ uid: null, values: {} })
  const [alerts, setAlerts] = useState(savedSettings.alerts)
  const [preferences, setPreferences] = useState(savedSettings.preferences)
  const [activeDialog, setActiveDialog] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [passwordDraft, setPasswordDraft] = useState({ current: '', next: '', confirm: '' })
  const [passwordErrors, setPasswordErrors] = useState({})

  const identityProfile = {
    name: userProfile?.displayName || (session?.firebaseAuthenticated ? session.identifier : ''),
    email: userProfile?.email || (session?.firebaseAuthenticated ? session.identifier : ''),
    phone: userProfile?.phone || '',
  }
  const profileEdits = profileDraft.uid === userProfile?.uid ? profileDraft.values : {}
  const profile = {
    ...savedSettings.profile,
    ...identityProfile,
    ...profileEdits,
  }

  const persistSettings = (nextSettings, successMessage) => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings))
      setSavedSettings(nextSettings)
      window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT, { detail: { profile: nextSettings.profile } }))
      notify(successMessage, 'success')
      return true
    } catch {
      notify('Could not save settings in this browser. Your changes are temporary.', 'error')
      return false
    }
  }

  const updatePreference = (key, value) => {
    const nextSettings = { ...savedSettings, preferences: { ...preferences, [key]: value } }
    setPreferences(nextSettings.preferences)
    persistSettings(nextSettings, 'Preference saved in this browser.')
  }

  const updateAlert = (key, value) => {
    const nextSettings = { ...savedSettings, alerts: { ...alerts, [key]: value } }
    setAlerts(nextSettings.alerts)
    persistSettings(nextSettings, 'Notification preference saved in this browser.')
  }

  const editProfile = (key, value) => {
    const uid = userProfile?.uid || null
    setProfileDraft((current) => ({
      uid,
      values: { ...(current.uid === uid ? current.values : {}), [key]: value },
    }))
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    setSavingProfile(true)
    try {
      if (userProfile?.uid) {
        await updateUserProfile(userProfile.uid, { displayName: profile.name, phone: profile.phone })
      }
      const nextSettings = { ...savedSettings, profile }
      const saved = persistSettings(
        nextSettings,
        userProfile?.uid ? 'Profile saved to your Firebase account.' : 'Profile saved in this browser.',
      )
      if (saved) {
        setProfileDraft({ uid: userProfile?.uid || null, values: {} })
      }
    } catch (error) {
      notify(getAuthErrorMessage(error, 'save your profile'), 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const cancelProfile = () => {
    setProfileDraft({ uid: userProfile?.uid || null, values: {} })
    notify('Profile changes discarded.', 'info')
  }

  const submitPasswordChange = (event) => {
    event.preventDefault()
    const nextErrors = {}

    if (!passwordDraft.current.trim()) nextErrors.current = 'Enter your current password.'
    if (passwordDraft.next.length < 8) nextErrors.next = 'New password must be at least 8 characters.'
    if (passwordDraft.confirm !== passwordDraft.next) nextErrors.confirm = 'Passwords do not match.'

    setPasswordErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setPasswordDraft({ current: '', next: '', confirm: '' })
    setPasswordErrors({})
    setActiveDialog('')
    notify('Password change form validated for this front-end design.', 'info')
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your commuter profile, alerts, and travel preferences."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <UserRound size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-navy">Profile</h2>
                <p className="text-sm text-slate-500">Your commuter account information</p>
              </div>
            </div>

            <form onSubmit={saveProfile}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Full name</span>
                <input
                  required
                  value={profile.name}
                  onChange={(e) => editProfile('name', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500 outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Phone number</span>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => editProfile('phone', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Default route</span>
                <Select
                  value={profile.routePreference}
                  onChange={(e) => editProfile('routePreference', e.target.value)}
                  className="rounded-xl border-slate-200 bg-slate-50 hover:border-brand/40 hover:bg-white"
                >
                  <option value="">No default route</option>
                  {routes.filter((route) => route.status === 'Active').map((route) => (
                    <option key={route.id} value={route.id} data-desc={route.name}>{route.id}</option>
                  ))}
                </Select>
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={cancelProfile}>Cancel</Button>
              <Button type="submit" disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save profile'}</Button>
            </div>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-navy">Notification preferences</h2>
                <p className="text-sm text-slate-500">Choose what updates you want to receive</p>
              </div>
            </div>

            <div className="space-y-3">
              <ToggleRow
                label="Service disruptions"
                hint="Route delays, detours, and temporary stop changes"
                checked={alerts.service}
                onChange={(value) => updateAlert('service', value)}
              />
              <ToggleRow
                label="Safety alerts"
                hint="Weather advisories and emergency safety updates"
                checked={alerts.safety}
                onChange={(value) => updateAlert('safety', value)}
              />
              <ToggleRow
                label="Route updates"
                hint="Changes in your usual commute routes"
                checked={alerts.route}
                onChange={(value) => updateAlert('route', value)}
              />
              <ToggleRow
                label="Report follow-ups"
                hint="Status changes for lost item and incident reports"
                checked={alerts.report}
                onChange={(value) => updateAlert('report', value)}
              />
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                <Palette size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-navy">App preferences</h2>
              </div>
            </div>

            <div className="space-y-3">
              <ToggleRow
                label="Dark mode"
                hint="Saved in this browser; visual theme switching is not implemented yet"
                checked={preferences.darkMode}
                onChange={(value) => updatePreference('darkMode', value)}
              />
              <ToggleRow
                label="Compact view"
                hint="Saved in this browser; layout density is not changed yet"
                checked={preferences.compactView}
                onChange={(value) => updatePreference('compactView', value)}
              />
              <ToggleRow
                label="Use my location"
                hint="Saved in this browser; device location is not requested"
                checked={preferences.useLocation}
                onChange={(value) => updatePreference('useLocation', value)}
              />
              <ToggleRow
                label="Sound alerts"
                hint="Saved in this browser; no audio is played"
                checked={preferences.soundAlerts}
                onChange={(value) => updatePreference('soundAlerts', value)}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">These options are saved locally as UI preferences. Theme, layout density, location, and sound behavior need application or device-service support before they can take effect.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-navy">Privacy & security</h2>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <button type="button" onClick={() => setActiveDialog('password')} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left font-medium text-slate-700 transition hover:border-brand/30 hover:bg-white hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
                <span className="inline-flex items-center gap-2"><Lock size={16} /> Change password</span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
              <button type="button" onClick={() => setActiveDialog('devices')} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left font-medium text-slate-700 transition hover:border-brand/30 hover:bg-white hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
                <span className="inline-flex items-center gap-2"><Smartphone size={16} /> Manage devices</span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
              <button type="button" onClick={() => setActiveDialog('privacy')} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left font-medium text-slate-700 transition hover:border-brand/30 hover:bg-white hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
                <span className="inline-flex items-center gap-2"><Moon size={16} /> Privacy controls</span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            </div>
          </div>
        </aside>
      </div>
      {activeDialog === 'password' && (
        <Modal
          open={activeDialog === 'password'}
          onClose={() => {
            setActiveDialog('')
            setPasswordDraft({ current: '', next: '', confirm: '' })
            setPasswordErrors({})
          }}
          title="Change password"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => {
                setActiveDialog('')
                setPasswordDraft({ current: '', next: '', confirm: '' })
                setPasswordErrors({})
              }}>Cancel</Button>
              <Button type="submit" form="commuter-password-form">Update password</Button>
            </>
          }
        >
          <div className="space-y-4">
            <form id="commuter-password-form" onSubmit={submitPasswordChange} className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Current password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={passwordDraft.current}
                  onChange={(event) => setPasswordDraft((current) => ({ ...current, current: event.target.value }))}
                  className={`w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand ${passwordErrors.current ? 'border-red-300' : 'border-slate-200'}`}
                />
                {passwordErrors.current && <span className="mt-1 block text-xs text-red-600">{passwordErrors.current}</span>}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">New password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={passwordDraft.next}
                  onChange={(event) => setPasswordDraft((current) => ({ ...current, next: event.target.value }))}
                  className={`w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand ${passwordErrors.next ? 'border-red-300' : 'border-slate-200'}`}
                />
                {passwordErrors.next && <span className="mt-1 block text-xs text-red-600">{passwordErrors.next}</span>}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Confirm new password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={passwordDraft.confirm}
                  onChange={(event) => setPasswordDraft((current) => ({ ...current, confirm: event.target.value }))}
                  className={`w-full rounded-xl border bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand ${passwordErrors.confirm ? 'border-red-300' : 'border-slate-200'}`}
                />
                {passwordErrors.confirm && <span className="mt-1 block text-xs text-red-600">{passwordErrors.confirm}</span>}
              </label>
            </form>
          </div>
        </Modal>
      )}

      {activeDialog === 'devices' && (
        <Modal
          open={activeDialog === 'devices'}
          onClose={() => setActiveDialog('')}
          title="Manage devices"
          size="md"
          footer={<Button onClick={() => setActiveDialog('')}>Close</Button>}
        >
          <div className="space-y-4">
            <div className="space-y-3">
              {[
                { name: 'This phone', type: 'Mobile', location: 'Manila, Philippines', status: 'Active now' },
                { name: 'Office tablet', type: 'Tablet', location: 'Quezon City, Philippines', status: 'Last used 2 hours ago' },
                { name: 'Work computer', type: 'Desktop', location: 'Metro Manila, Philippines', status: 'Last used yesterday' },
              ].map((device) => (
                <div key={device.name} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <div>
                    <p className="text-sm font-semibold text-navy">{device.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{device.type} · {device.location}</p>
                  </div>
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-green-700">
                    {device.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {activeDialog === 'privacy' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveDialog('')
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="settings-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <h2 id="settings-dialog-title" className="text-base font-bold text-navy">Privacy controls</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              You can manage notification and location preferences above. Location access is not requested or collected.
            </p>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setActiveDialog('')}>Close</Button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
