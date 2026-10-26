import { useRef, useState } from 'react'
import {
  Bell,
  Check,
  FileText,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Phone,
  X,
} from 'lucide-react'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'
import { useToast } from '../../admin/context/ToastContext.jsx'
import { PageHeader } from '../../admin/components/Card.jsx'

const categoryGuide = [
  { label: 'Driver', desc: 'Driver conduct, route issues, speeding, unsafe driving.', tone: 'red' },
  { label: 'Conductor', desc: 'Conductor conduct, staff behavior, route support issues.', tone: 'violet' },
  { label: 'Passenger', desc: 'Passenger conduct, disputes, safety or misconduct.', tone: 'amber' },
  { label: 'Bus Condition', desc: 'Air conditioning, ventilation, maintenance, cleanliness.', tone: 'orange' },
  { label: 'Delay / Schedule', desc: 'Trip delays, missed stops, schedule disruption.', tone: 'blue' },
  { label: 'Overcrowding', desc: 'Overloaded trips, queue issues, unsafe standing space.', tone: 'purple' },
  { label: 'Lost Item', desc: 'Item left behind, missing belongings, recovery status.', tone: 'teal' },
  { label: 'General Concern', desc: 'General complaints, service quality, observations.', tone: 'slate' },
]

const categoryToneClasses = {
  red: 'bg-red-100 text-red-700',
  violet: 'bg-violet-100 text-violet-700',
  amber: 'bg-amber-100 text-amber-700',
  orange: 'bg-orange-100 text-orange-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  teal: 'bg-teal-100 text-teal-700',
  slate: 'bg-slate-200 text-slate-700',
}

const demoReports = [
  { title: 'AC Malfunction on Route 2 (Bus #5678)', status: 'Under Inspection', tone: 'blue' },
  { title: 'Skipped Stop at Quezon City University', status: 'Resolved', tone: 'green' },
]

const localDate = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const createInitialForm = () => ({
  category: '',
  busId: '',
  otherBus: '',
  date: localDate(),
  time: '',
  routeId: '',
  location: '',
  otherLocation: '',
  severity: 'Mid',
  details: '',
  phone: '',
  anonymous: true,
})

export default function Report() {
  const { routes, buses, stops } = useAdminData()
  const { notify } = useToast()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState(createInitialForm)
  const [evidence, setEvidence] = useState([])
  const [activeReports, setActiveReports] = useState(demoReports)
  const [selectedReport, setSelectedReport] = useState(null)
  const selectedRoute = routes.find((route) => route.id === form.routeId)
  const availableStops = selectedRoute
    ? selectedRoute.stopIds.map((id) => stops.find((stop) => stop.id === id)).filter(Boolean)
    : stops.filter((stop) => stop.status === 'Active')
  const availableBuses = buses.filter((bus) => bus.status === 'Active' && (!form.routeId || bus.routeId === form.routeId))

  const updateForm = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const resetForm = () => {
    setForm(createInitialForm())
    setEvidence([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    notify('Incident report form cleared.', 'info')
  }

  const handleEvidenceChange = (event) => {
    const selectedFiles = Array.from(event.target.files || [])
    const allowedTypes = ['image/png', 'image/jpeg', 'video/mp4', 'application/pdf']
    const supportedFiles = selectedFiles.filter((file) => allowedTypes.includes(file.type))
    const validFiles = supportedFiles.filter((file) => file.size <= 25 * 1024 * 1024)
    if (supportedFiles.length !== selectedFiles.length) notify('Evidence must be PNG, JPG, MP4, or PDF.', 'error')
    if (validFiles.length !== supportedFiles.length) notify('Each evidence file must be 25 MB or smaller.', 'error')
    const remainingSlots = Math.max(0, 5 - evidence.length)
    if (validFiles.length > remainingSlots) notify('You can attach up to 5 evidence files.', 'error')
    setEvidence((current) => [...current, ...validFiles.slice(0, remainingSlots)])
    event.target.value = ''
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const category = categoryGuide.find((item) => item.label === form.category)?.label
    const bus = buses.find((item) => item.id === form.busId)
    const routeName = selectedRoute ? `${selectedRoute.id} · ${selectedRoute.name}` : 'Route not specified'
    const location = form.location === 'other' ? form.otherLocation : form.location
    const newReport = {
      title: `${form.category} report · ${routeName}`,
      status: 'Pending Review',
      tone: 'amber',
      details: `${category} · ${form.severity} urgency · ${location || 'Location not specified'} · ${form.date} ${form.time}${bus ? ` · ${bus.id} (${bus.plate})` : form.otherBus ? ` · ${form.otherBus}` : ''}${form.anonymous ? ' · Submitted anonymously' : ''}${evidence.length ? ` · Evidence: ${evidence.map((file) => file.name).join(', ')}` : ''}. ${form.details}`,
    }
    setActiveReports((current) => [newReport, ...current])
    setSelectedReport(newReport)
    setForm(createInitialForm())
    setEvidence([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    notify('Demo incident report added to My Active Reports. It has not been sent to a service.', 'success')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Incident Report"
        description="Report a service incident, safety concern, or operational delay to the QC Commuter Protection & Safety Office."
        actions={<div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[9px] text-white">
            <Check size={10} />
          </span>
          <span className="font-semibold text-slate-700">QC LGU Hotline 122 • Police Dispatch Active</span>
        </div>}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.9fr)]">
        <form onSubmit={handleSubmit} className="min-w-0 rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <FileText size={18} />
              </div>
              <div>
                <div className="text-xl font-black text-navy">Submit an Incident Report</div>
                <div className="text-sm text-slate-500">Fields with an asterisk (*) are required for investigation.</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Report Category <span className="text-red-500">*</span></label>
              <select required value={form.category} onChange={updateForm('category')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand">
                <option value="">Select concern category...</option>
                {categoryGuide.map(({ label }) => <option key={label}>{label}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Bus Fleet / Unit Number</label>
              <select value={form.busId} onChange={(event) => setForm((current) => ({ ...current, busId: event.target.value, otherBus: '' }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand">
                <option value="">Bus unknown / not listed</option>
                {availableBuses.map((bus) => <option key={bus.id} value={bus.id}>{bus.id} · {bus.plate}</option>)}
                <option value="other">Other unit...</option>
              </select>
              {form.busId === 'other' && (
                <input required value={form.otherBus} onChange={updateForm('otherBus')} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" placeholder="Enter bus number or plate" />
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Operational Date</label>
              <input required type="date" value={form.date} onChange={updateForm('date')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Time</label>
              <input required type="time" value={form.time} onChange={updateForm('time')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Route</label>
              <select value={form.routeId} onChange={(event) => setForm((current) => ({ ...current, routeId: event.target.value, busId: '' }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand">
                <option value="">Select route if known...</option>
                {routes.filter((route) => route.status === 'Active').map((route) => (
                  <option key={route.id} value={route.id}>{route.id} · {route.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Estimated Location / Terminal / Seat Position</label>
              <div className="relative">
                <select value={form.location} onChange={updateForm('location')} className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-brand">
                  <option value="">Select stop or location if known...</option>
                  {availableStops.map((stop) => <option key={stop.id} value={stop.name}>{stop.name}</option>)}
                  <option value="other">Other location...</option>
                </select>
                <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              {form.location === 'other' && (
                <input required value={form.otherLocation} onChange={updateForm('otherLocation')} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" placeholder="Enter terminal, stop, or landmark" />
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Incident Severity / Urgency <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-3 rounded-xl border border-slate-200 bg-slate-50 p-1">
                {['Low', 'Mid', 'High'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, severity: level }))}
                    aria-pressed={form.severity === level}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                      form.severity === level
                        ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200'
                        : 'text-slate-600 hover:bg-white/70'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Details &amp; Statement <span className="text-red-500">*</span></label>
              <textarea
                rows={5}
                required
                value={form.details}
                onChange={updateForm('details')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand"
                placeholder="Provide as much detail as possible including what occurred, your description, exact stop or landmark, and circumstances..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Photo / Video / Dashboard Ticket Evidence Upload</label>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,video/mp4,application/pdf" multiple onChange={handleEvidenceChange} className="sr-only" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-[110px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500 transition-all duration-150 hover:border-brand/50 hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
              >
                <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
                  <Upload size={18} />
                </span>
                <span>Choose photos, ticket receipts, or video clips</span>
                <span className="mt-1 text-xs text-slate-400">PNG, JPG, MP4, or PDF · Up to 25 MB each · 5 files maximum</span>
              </button>
              {evidence.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {evidence.map((file, index) => (
                    <li key={`${file.name}-${file.lastModified}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                      <span className="min-w-0 flex-1 truncate">{file.name}</span>
                      <span className="shrink-0 text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                      <button
                        type="button"
                        onClick={() => setEvidence((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                        aria-label={`Remove ${file.name}`}
                        className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                      >
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Bell size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Anonymous Submission</div>
                <div className="text-xs text-slate-500">Keep my identity confidential from the private bus operator and staff.</div>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={form.anonymous}
              aria-label="Submit anonymously"
              onClick={() => setForm((current) => ({ ...current, anonymous: !current.anonymous }))}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 ${form.anonymous ? 'bg-brand' : 'bg-slate-300'}`}
            >
              <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${form.anonymous ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {!form.anonymous && (
            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Contact Phone <span className="text-slate-400">(optional)</span></label>
              <input type="tel" inputMode="tel" value={form.phone} onChange={updateForm('phone')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" placeholder="For follow-up about this report" />
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-3">
            <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-100 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2">
              Clear Form
            </button>
            <button type="submit" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-brand/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 active:translate-y-0">
              Submit Report
            </button>
          </div>
        </form>

        <aside className="min-w-0 space-y-5">
          <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-base font-black text-navy">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <FileText size={16} />
              </div>
              Report Categories Guide
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {categoryGuide.map(({ label, desc, tone }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, category: label }))}
                  aria-pressed={form.category === label}
                  className={`rounded-xl border p-2.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                    form.category === label
                      ? 'border-brand bg-brand/5 shadow-sm ring-1 ring-brand/20'
                      : 'border-slate-200 bg-white hover:border-brand/30 hover:bg-slate-50 hover:shadow-sm'
                  }`}
                >
                  <span className={`mb-1.5 inline-flex rounded-md px-2 py-0.5 !text-xs font-bold uppercase tracking-[0.06em] ${categoryToneClasses[tone]}`}>
                    {label}
                  </span>
                  <div className="!text-sm leading-5 text-slate-600">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-base font-black text-navy">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <ShieldCheck size={16} />
              </div>
              My Active Reports
            </div>

            <div className="space-y-3">
              {activeReports.map((report) => (
                <button
                  key={report.title}
                  type="button"
                  onClick={() => setSelectedReport(selectedReport?.title === report.title ? null : report)}
                  aria-expanded={selectedReport?.title === report.title}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition-all duration-150 hover:border-brand/30 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-bold text-slate-800">{report.title}</div>
                    <span className={`commuter-status-tag shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${
                      report.tone === 'blue' ? 'bg-blue-100 text-blue-700' :
                      report.tone === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  {selectedReport?.title === report.title && (
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      {report.details || 'No additional details available.'}
                      {report.tone === 'amber' && <span className="mt-1 block font-semibold text-amber-700">Front-end demo only; this report is not sent to a service.</span>}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-brand/20 bg-brand p-5 text-white shadow-sm">
            <div className="mb-3 flex items-center gap-3 text-lg font-black">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <ShieldAlert size={18} />
              </div>
              Emergency &amp; Immediate Assistance
            </div>

            <p className="text-sm leading-6 text-blue-50">
              If you or another commuter are in immediate physical danger, alert the on-board crew or dial emergency help now.
            </p>

            <div className="mt-4 space-y-3 rounded-xl border border-white/15 bg-white/5 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <Phone size={16} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.12em] text-blue-100">QC Central Command</div>
                  <a href="tel:+63288884242" className="text-base font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">(02) 8888-4242</a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <Bell size={16} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.12em] text-blue-100">Hotline</div>
                  <a href="tel:122" className="text-base font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">122</a>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
