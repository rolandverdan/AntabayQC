import { Bell, Volume2, Map as MapIcon, Siren, RotateCcw, Play, Info } from 'lucide-react'
import Card, { PageHeader, Notice } from '../../admin/components/Card.jsx'
import Button from '../../admin/components/Button.jsx'
import Select from '../../shared/components/Select.jsx'
import Toggle from '../components/Toggle.jsx'
import { useConductor } from '../context/ConductorContext.jsx'
import { useToast } from '../../admin/context/ToastContext.jsx'
import { playTone } from '../utils/sound.js'

function Row({ title, description, htmlFor, children }) {
  return (
    <div className="flex min-h-[4rem] items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <label htmlFor={htmlFor} className="block text-sm font-semibold leading-5 text-navy">{title}</label>
        {description && <p className="text-xs leading-4 text-slate-500">{description}</p>}
      </div>
      <div className="flex shrink-0 items-center justify-end">{children}</div>
    </div>
  )
}

/** Stacked row for sliders: label + value on top, full-width slider below. */
function SliderRow({ title, value, htmlFor, children }) {
  return (
    <div className="py-3">
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-sm font-semibold leading-5 text-navy">{title}</label>
        <span className="text-sm font-semibold text-brand">{value}</span>
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { settings, updateSetting, resetSettings } = useConductor()
  const { notify } = useToast()
  const { notifications: n, sound, map, sos } = settings

  const reset = () => { resetSettings(); notify('Settings restored to defaults.', 'info') }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader hideTitle
        title="Settings"
        description="Changes apply right away. They are kept only while you stay signed in on this page."
        actions={<Button variant="secondary" icon={RotateCcw} onClick={reset}>Restore defaults</Button>}
      />

      <div className="space-y-4">
        <Card title="Notifications" action={<Bell size={16} className="text-slate-400" />} bodyClass="px-5 py-1 divide-y divide-slate-100">
          <Row title="Route delay alerts" description="Traffic and schedule delays on your route." htmlFor="n-delays">
            <Toggle id="n-delays" checked={n.delays} onChange={(v) => updateSetting('notifications', 'delays', v)} label="Route delay alerts" />
          </Row>
          <Row title="Passenger load alerts" description="Crowded stops and a full vehicle." htmlFor="n-pass">
            <Toggle id="n-pass" checked={n.passengerAlerts} onChange={(v) => updateSetting('notifications', 'passengerAlerts', v)} label="Passenger load alerts" />
          </Row>
          <Row title="Messages from operations" description="Notes sent by the admin team." htmlFor="n-admin">
            <Toggle id="n-admin" checked={n.adminMessages} onChange={(v) => updateSetting('notifications', 'adminMessages', v)} label="Messages from operations" />
          </Row>
        </Card>

        <Card title="Sound alerts" action={<Volume2 size={16} className="text-slate-400" />} bodyClass="px-5 py-1 divide-y divide-slate-100">
          <Row title="Play sounds for alerts" description="Turn off to keep the app silent." htmlFor="s-on">
            <Toggle id="s-on" checked={sound.enabled} onChange={(v) => updateSetting('sound', 'enabled', v)} label="Play sounds for alerts" />
          </Row>
          <Row title="Alert tone" htmlFor="s-tone">
            <Select id="s-tone" value={sound.tone} disabled={!sound.enabled} onChange={(e) => updateSetting('sound', 'tone', e.target.value)} wrapperClassName="w-40">
              <option value="chime">Chime</option>
              <option value="beep">Beep</option>
              <option value="alert">Urgent alert</option>
            </Select>
          </Row>
          <SliderRow title="Volume" value={`${sound.volume}%`} htmlFor="s-vol">
            <input id="s-vol" type="range" min="0" max="100" step="5" value={sound.volume} disabled={!sound.enabled} onChange={(e) => updateSetting('sound', 'volume', Number(e.target.value))} className="vol-slider w-full disabled:opacity-50" style={{ '--fill': `${sound.volume}%` }} />
          </SliderRow>
          <div className="py-3">
            <Button variant="secondary" icon={Play} disabled={!sound.enabled} onClick={() => playTone(sound.tone, sound.volume)} className="w-full border-brand/40 text-brand">Play test sound</Button>
          </div>
        </Card>

        <Card title="Map display" action={<MapIcon size={16} className="text-slate-400" />} bodyClass="px-5 py-1 divide-y divide-slate-100">
          <Row title="Show route line" description="Draw your route on the map." htmlFor="m-route">
            <Toggle id="m-route" checked={map.showRoute} onChange={(v) => updateSetting('map', 'showRoute', v)} label="Show route line" />
          </Row>
          <Row title="Show bus stops" description="Mark every stop on your route." htmlFor="m-stops">
            <Toggle id="m-stops" checked={map.showStops} onChange={(v) => updateSetting('map', 'showStops', v)} label="Show bus stops" />
          </Row>
          <Row title="Follow my vehicle" description="Keep the map centered on the vehicle." htmlFor="m-follow">
            <Toggle id="m-follow" checked={map.followVehicle} onChange={(v) => updateSetting('map', 'followVehicle', v)} label="Follow my vehicle" />
          </Row>
          <Row title="Default zoom" description="Used when you center on your vehicle." htmlFor="m-zoom">
            <Select id="m-zoom" value={map.defaultZoom} onChange={(e) => updateSetting('map', 'defaultZoom', Number(e.target.value))} wrapperClassName="w-40">
              <option value={12}>Wide (12)</option>
              <option value={14}>Standard (14)</option>
              <option value={16}>Close (16)</option>
            </Select>
          </Row>
        </Card>

        <Card title="SOS confirmation" action={<Siren size={16} className="text-red-500" />} bodyClass="px-5 py-1 divide-y divide-slate-100">
          <Row title="Press and hold to send" description="Prevents accidental reports. Recommended." htmlFor="sos-hold">
            <Toggle id="sos-hold" checked={sos.holdToConfirm} onChange={(v) => updateSetting('sos', 'holdToConfirm', v)} label="Press and hold to send" />
          </Row>
          <Row title="Hold time" htmlFor="sos-secs">
            <Select id="sos-secs" value={sos.holdSeconds} disabled={!sos.holdToConfirm} onChange={(e) => updateSetting('sos', 'holdSeconds', Number(e.target.value))} wrapperClassName="w-40">
              <option value={1}>1 second</option>
              <option value={2}>2 seconds</option>
              <option value={3}>3 seconds</option>
            </Select>
          </Row>
          <div className="py-3">
            <Notice tone="blue" icon={Info}>The review step before sending is always shown and cannot be turned off.</Notice>
          </div>
        </Card>
      </div>
    </div>
  )
}
