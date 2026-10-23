import { useState } from 'react'
import {
  Bell,
  Lock,
  Moon,
  Palette,
  ShieldCheck,
  Smartphone,
  UserRound,
} from 'lucide-react'
import { PageHeader } from '../../admin/components/Card.jsx'
import Button from '../../admin/components/Button.jsx'

const profileInitial = {
  name: 'Maria Santos',
  email: 'maria.santos@gmail.com',
  phone: '+63 912 345 6789',
  routePreference: 'R-02 QC Hall ↔ Commonwealth',
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
        className="h-4 w-4 accent-brand"
      />
    </label>
  )
}

export default function Settings() {
  const [profile, setProfile] = useState(profileInitial)
  const [alerts, setAlerts] = useState({
    service: true,
    safety: true,
    route: true,
    report: false,
  })
  const [preferences, setPreferences] = useState({
    darkMode: false,
    compactView: false,
    useLocation: true,
    soundAlerts: true,
  })

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your commuter profile, alerts, and travel preferences."
      />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5">
          <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <UserRound size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-navy">Profile</h2>
                <p className="text-sm text-slate-500">Your commuter account information</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Full name</span>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Phone number</span>
                <input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Default route</span>
                <input
                  value={profile.routePreference}
                  onChange={(e) => setProfile({ ...profile, routePreference: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary">Cancel</Button>
              <Button>Save profile</Button>
            </div>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-navy">Notification preferences</h2>
                <p className="text-sm text-slate-500">Choose what updates you want to receive</p>
              </div>
            </div>

            <div className="space-y-3">
              <ToggleRow
                label="Service disruptions"
                hint="Route delays, detours, and temporary stop changes"
                checked={alerts.service}
                onChange={(value) => setAlerts({ ...alerts, service: value })}
              />
              <ToggleRow
                label="Safety alerts"
                hint="Weather advisories and emergency safety updates"
                checked={alerts.safety}
                onChange={(value) => setAlerts({ ...alerts, safety: value })}
              />
              <ToggleRow
                label="Route updates"
                hint="Changes in your usual commute routes"
                checked={alerts.route}
                onChange={(value) => setAlerts({ ...alerts, route: value })}
              />
              <ToggleRow
                label="Report follow-ups"
                hint="Status changes for lost item and incident reports"
                checked={alerts.report}
                onChange={(value) => setAlerts({ ...alerts, report: value })}
              />
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                <Palette size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-navy">App preferences</h2>
              </div>
            </div>

            <div className="space-y-3">
              <ToggleRow
                label="Dark mode"
                hint="Use a darker color theme"
                checked={preferences.darkMode}
                onChange={(value) => setPreferences({ ...preferences, darkMode: value })}
              />
              <ToggleRow
                label="Compact view"
                hint="Reduce spacing and card size"
                checked={preferences.compactView}
                onChange={(value) => setPreferences({ ...preferences, compactView: value })}
              />
              <ToggleRow
                label="Use my location"
                hint="Show nearby stops and routes"
                checked={preferences.useLocation}
                onChange={(value) => setPreferences({ ...preferences, useLocation: value })}
              />
              <ToggleRow
                label="Sound alerts"
                hint="Play a notification sound for important updates"
                checked={preferences.soundAlerts}
                onChange={(value) => setPreferences({ ...preferences, soundAlerts: value })}
              />
            </div>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-navy">Privacy & security</h2>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <button type="button" className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left font-medium text-slate-700">
                <span className="inline-flex items-center gap-2"><Lock size={16} /> Change password</span>
                <span className="text-slate-400">›</span>
              </button>
              <button type="button" className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left font-medium text-slate-700">
                <span className="inline-flex items-center gap-2"><Smartphone size={16} /> Manage devices</span>
                <span className="text-slate-400">›</span>
              </button>
              <button type="button" className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left font-medium text-slate-700">
                <span className="inline-flex items-center gap-2"><Moon size={16} /> Privacy controls</span>
                <span className="text-slate-400">›</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
