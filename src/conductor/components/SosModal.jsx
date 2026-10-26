import { useEffect, useState } from 'react'
import {
  TriangleAlert, HeartPulse, CarFront, Wrench, Users, ShieldAlert, Flame, CircleAlert,
  CircleCheck, Loader2, MapPin, Clock, Info,
} from 'lucide-react'
import Modal from '../../admin/components/Modal.jsx'
import Button from '../../admin/components/Button.jsx'
import { EMERGENCY_TYPES, VEHICLE, ROUTE } from '../data/mock.js'
import { useConductor } from '../context/ConductorContext.jsx'
import HoldButton from './HoldButton.jsx'

const ICONS = { HeartPulse, CarFront, Wrench, Users, ShieldAlert, Flame, CircleAlert }
const MAX_DESC = 300

const fmtTime = (d) => d.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })

/**
 * SOS flow: 1) choose type + optional details  2) confirm  3) simulated result.
 * `location` is the current mock vehicle location supplied by the layout.
 * FRONTEND DEMO: nothing is transmitted and nobody is contacted.
 */
export default function SosModal({ open, onClose, location }) {
  const { settings, setSosReport } = useConductor()
  const [step, setStep] = useState('select') // select | confirm | sending | sent
  const [typeId, setTypeId] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)

  useEffect(() => {
    if (open) {
      setStep('select'); setTypeId(''); setDescription(''); setError(''); setReport(null)
    }
  }, [open])

  const type = EMERGENCY_TYPES.find((t) => t.id === typeId)

  const toConfirm = () => {
    if (!type) {
      setError('Select an emergency type to continue.')
      return
    }
    setError('')
    setStep('confirm')
  }

  const submit = () => {
    setStep('sending')
    setTimeout(() => {
      const r = {
        id: `SOS-${Math.floor(1000 + Math.random() * 9000)}`,
        type: type.label,
        description: description.trim(),
        location,
        vehicle: `${VEHICLE.id} · ${VEHICLE.plate}`,
        route: `${ROUTE.id} · ${ROUTE.name}`,
        at: new Date(),
        status: 'Simulated — not transmitted',
      }
      setReport(r)
      setSosReport(r)
      setStep('sent')
    }, 1200)
  }

  const locked = step === 'sending'
  const handleClose = () => { if (!locked) onClose() }

  let title = 'Report an emergency'
  let footer = null
  if (step === 'select') {
    footer = (
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={toConfirm}>Continue</Button>
      </>
    )
  } else if (step === 'confirm') {
    title = 'Confirm emergency report'
    footer = (
      <>
        <Button variant="secondary" onClick={() => setStep('select')}>Back</Button>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        {settings.sos.holdToConfirm
          ? <HoldButton seconds={settings.sos.holdSeconds} onComplete={submit}>Hold to send report</HoldButton>
          : <Button variant="danger" onClick={submit}>Send report</Button>}
      </>
    )
  } else if (step === 'sending') {
    title = 'Sending report…'
  } else {
    title = 'Report recorded'
    footer = <Button onClick={onClose}>Done</Button>
  }

  return (
    <Modal open={open} onClose={handleClose} title={title} size="md" footer={footer}>
      {step === 'select' && (
        <div>
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            <p>Use this only for a real emergency. You will be asked to confirm before anything is sent.</p>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-navy">
              What kind of emergency is it? <span className="text-red-500">*</span>
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-required="true">
              {EMERGENCY_TYPES.map((t) => {
                const Icon = ICONS[t.icon]
                const selected = t.id === typeId
                return (
                  <label
                    key={t.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition focus-within:ring-2 focus-within:ring-red-300 ${
                      selected ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio" name="emergency-type" value={t.id} checked={selected}
                      onChange={() => { setTypeId(t.id); setError('') }}
                      className="sr-only"
                    />
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-navy">{t.label}</span>
                      <span className="block text-xs text-slate-500">{t.hint}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            {error && <p role="alert" className="mt-2 text-xs font-medium text-red-600">{error}</p>}
          </fieldset>

          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-semibold text-navy">Additional details (optional)</span>
            <textarea
              value={description}
              maxLength={MAX_DESC}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is happening? How many people need help?"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <span className="mt-1 block text-right text-xs text-slate-500">{description.length}/{MAX_DESC}</span>
          </label>
        </div>
      )}

      {step === 'confirm' && (
        <div>
          <p className="mb-3 text-sm text-slate-600">Check the details below. Nothing is sent until you confirm.</p>
          <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
            <Row label="Emergency type" value={type.label} strong />
            <Row label="Details" value={description.trim() || 'No details added'} />
            <Row label="Current location" value={`${location.label} (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`} />
            <Row label="Vehicle" value={`${VEHICLE.id} · ${VEHICLE.plate}`} />
          </dl>
          {settings.sos.holdToConfirm && (
            <p className="mt-3 flex items-start gap-2 text-xs text-slate-500">
              <Info size={14} className="mt-0.5 shrink-0" />
              Press and hold the red button for {settings.sos.holdSeconds} seconds to send. Let go early to cancel.
            </p>
          )}
        </div>
      )}

      {step === 'sending' && (
        <div className="flex flex-col items-center gap-3 py-8 text-slate-600" role="status">
          <Loader2 size={32} className="animate-spin text-brand" />
          <p className="text-sm">Recording your report…</p>
        </div>
      )}

      {step === 'sent' && report && (
        <div>
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-900" role="status">
            <CircleCheck size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Report created</p>
              <p className="mt-0.5 text-xs">
                No dispatcher, emergency service, or other personnel has been contacted from this version.
              </p>
            </div>
          </div>
          <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
            <Row label="Report ID" value={report.id} />
            <Row label="Emergency type" value={report.type} strong />
            <Row label="Details" value={report.description || 'No details added'} />
            <Row
              label="Location"
              value={<span className="inline-flex items-center gap-1"><MapPin size={14} />{report.location.label} ({report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)})</span>}
            />
            <Row label="Vehicle / route" value={`${report.vehicle} · ${report.route}`} />
            <Row label="Time" value={<span className="inline-flex items-center gap-1"><Clock size={14} />{fmtTime(report.at)}</span>} />
            <Row label="Status" value={<span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">{report.status}</span>} />
          </dl>
          <p className="mt-3 text-xs text-slate-500">In a real deployment, this is where a backend would notify the operations center.</p>
        </div>
      )}
    </Modal>
  )
}

function Row({ label, value, strong = false }) {
  return (
    <div className="grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[9rem_1fr] sm:gap-3">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className={`break-words ${strong ? 'font-semibold text-navy' : 'text-slate-700'}`}>{value}</dd>
    </div>
  )
}
