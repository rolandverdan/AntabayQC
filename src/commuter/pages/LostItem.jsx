import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'
import { useToast } from '../../admin/context/ToastContext.jsx'
import { PageHeader } from '../../admin/components/Card.jsx'
import BackToSupport from '../components/BackToSupport.jsx'
import { Check, ChevronRight, CircleAlert, Copy, FileText, MapPin, Package, Phone, ShieldCheck, Upload, X } from 'lucide-react'

const itemCategories = [
  'Bags & Backpacks',
  'Wallets & Cards',
  'Phones & Electronics',
  'Clothing & Accessories',
  'Keys',
  'Documents',
  'Other',
]

const localDate = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

const isTtmdOpenNow = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const value = (type) => parts.find((part) => part.type === type)?.value
  const weekday = value('weekday')
  const minutes = Number(value('hour')) * 60 + Number(value('minute'))

  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(weekday) && minutes >= 8 * 60 && minutes < 17 * 60
}

const makeInitialForm = () => ({
  category: '',
  routeId: '',
  busId: '',
  otherBus: '',
  identifyingDetails: '',
  date: localDate(),
  time: '',
  location: '',
  otherLocation: '',
  description: '',
  phone: '',
})

export default function LostItem() {
  const { pathname } = useLocation()
  const { routes, buses, stops, addReport } = useAdminData()
  const { notify } = useToast()
  const fileInputRef = useRef(null)
  const detailTriggerRef = useRef(null)
  const dialogCloseRef = useRef(null)
  const [form, setForm] = useState(makeInitialForm)
  const [ttmdOpen, setTtmdOpen] = useState(isTtmdOpenNow)
  const [photo, setPhoto] = useState(null)
  const [copiedCaseRef, setCopiedCaseRef] = useState('')
  const [recentInquiries, setRecentInquiries] = useState([
    {
      id: 'QC-LR-2026-1008',
      title: 'Backpack',
      status: 'Pending',
      bus: 'Bus #1234',
      date: 'Oct 8, 2026',
      details: 'Black backpack left on the bus. Your report is being reviewed.',
    },
  ])
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const isFormActive = pathname === '/commuter/lost-item'
  const isReportsActive = pathname === '/commuter/lost-item-reports'

  useEffect(() => {
    const timer = window.setInterval(() => setTtmdOpen(isTtmdOpenNow()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!selectedInquiry) return undefined

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedInquiry(null)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    dialogCloseRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
      detailTriggerRef.current?.focus()
    }
  }, [selectedInquiry])

  const availableBuses = buses.filter((bus) => bus.status === 'Active' && (!form.routeId || bus.routeId === form.routeId))
  const selectedRoute = routes.find((route) => route.id === form.routeId)
  const availableStops = selectedRoute
    ? selectedRoute.stopIds.map((stopId) => stops.find((stop) => stop.id === stopId)).filter(Boolean)
    : stops.filter((stop) => stop.status === 'Active')

  const updateForm = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const copyCaseReference = async (caseRef) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(caseRef)
      } else {
        const temporaryInput = document.createElement('textarea')
        temporaryInput.value = caseRef
        temporaryInput.style.position = 'fixed'
        temporaryInput.style.opacity = '0'
        document.body.appendChild(temporaryInput)
        temporaryInput.select()
        const copied = document.execCommand('copy')
        temporaryInput.remove()
        if (!copied) throw new Error('Clipboard copy failed')
      }
      setCopiedCaseRef(caseRef)
      notify('Case reference copied.', 'success')
    } catch {
      notify('Could not copy the case reference.', 'error')
    }
  }

  const resetForm = () => {
    setForm(makeInitialForm())
    setPhoto(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    notify('Lost-item form cleared.', 'info')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const route = routes.find((item) => item.id === form.routeId)
    const bus = buses.find((item) => item.id === form.busId)
    const caseId = `QC-LR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
    const inquiry = {
      id: caseId,
      title: form.category,
      status: 'Pending',
      bus: bus ? `${bus.id} · ${bus.plate}` : form.otherBus || 'Bus not specified',
      date: new Date(`${form.date}T00:00:00`).toLocaleDateString(),
      route: route?.name || 'Not specified',
      location: form.location === 'other' ? form.otherLocation : form.location || 'Not specified',
      travelTime: form.time,
      description: form.description,
      identifyingDetails: form.identifyingDetails,
      details: [
        `${route?.name || 'Route not specified'} · ${form.location === 'other' ? form.otherLocation : form.location}`,
        `Travel date/time: ${form.date} at ${form.time}`,
        form.description,
        form.identifyingDetails && `Additional details: ${form.identifyingDetails}`,
      ].filter(Boolean).join('. '),
    }

    // Send to the admin side (Report Logs).
    const where = form.location === 'other' ? form.otherLocation : form.location
    addReport({
      type: 'Lost Item',
      priority: 'Medium',
      busId: bus?.id || '',
      otherBus: bus ? '' : form.otherBus,
      routeId: route?.id || '',
      reportedBy: 'Passenger',
      caseRef: caseId,
      location: where,
      contactPhone: form.phone ? `+63 ${form.phone.replace(/^\+?63/, '').trim()}` : '',
      evidence: photo?.name ? [photo.name] : [],
      description: `${form.category}: ${form.description}${form.identifyingDetails ? ` Identifying details: ${form.identifyingDetails}.` : ''} Travelled ${form.date} at ${form.time}${where ? `, ${where}` : ''}.`,
    })

    setRecentInquiries((items) => [inquiry, ...items])
    setForm(makeInitialForm())
    setPhoto(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    notify(`Report ${caseId} sent to the QC Bus team. You can track it under Check My Reports / Claims.`, 'success')
  }

  return (
    <div className="space-y-4">
      <BackToSupport />
      <PageHeader
        title="Lost Item"
        description="File an inquiry, track depot verification, and claim recovered items."
        actions={<div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 shadow-sm sm:w-auto sm:rounded-xl sm:bg-slate-50 sm:py-2 sm:shadow-none">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-brand sm:h-8 sm:w-8 sm:rounded-lg sm:bg-brand/10">
            <ShieldCheck size={16} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-800">QC TTMD Lost &amp; Found</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 sm:hidden">
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${ttmdOpen ? 'bg-green-500' : 'bg-slate-400'}`} />
              {ttmdOpen ? 'Open now' : 'Closed now'}
            </div>
            <p className="text-xs text-slate-500 sm:hidden">Mon–Fri · 8:00 AM–5:00 PM PHT</p>
            <p className="hidden text-xs text-slate-500 sm:block">{ttmdOpen ? 'Open now' : 'Closed now'} · Mon–Fri · 8:00 AM–5:00 PM PHT</p>
            <p className="text-[11px] text-slate-400 sm:hidden">2nd Floor, DPOS Building, QC Hall Compound</p>
          </div>
        </div>}
      />

      <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 sm:flex sm:items-center sm:gap-3 sm:rounded-2xl sm:bg-white sm:px-3 sm:py-2.5 sm:shadow-sm">
        <Link to="/commuter/lost-item" className={`flex min-h-10 items-center justify-center rounded-lg px-2 text-center text-sm font-bold transition sm:inline-flex sm:rounded-xl sm:px-4 sm:py-2 sm:text-left sm:shadow-sm ${isFormActive ? 'bg-brand text-white shadow-sm ring-2 ring-brand/20 hover:bg-brand/90' : 'text-slate-600 hover:bg-white hover:text-navy sm:border sm:border-slate-200 sm:bg-slate-50 sm:font-semibold sm:text-slate-700 sm:hover:border-slate-300 sm:hover:bg-slate-100 sm:hover:text-slate-700'}`}>
          Report Lost Item
        </Link>
        <Link to="/commuter/lost-item-reports" className={`flex min-h-10 items-center justify-center rounded-lg px-2 text-center text-sm font-semibold transition sm:inline-flex sm:rounded-xl sm:px-4 sm:py-2 sm:text-left sm:shadow-sm ${isReportsActive ? 'bg-brand text-white shadow-sm ring-2 ring-brand/20 hover:bg-brand/90 sm:font-normal' : 'text-slate-600 hover:bg-white hover:text-navy sm:border sm:border-slate-200 sm:bg-slate-50 sm:font-semibold sm:hover:border-slate-300 sm:hover:bg-slate-100'}`}>
          My Reports / Claims
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_0.75fr]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <FileText size={18} />
            </div>
            <div>
              <p className="text-base font-bold text-navy">Tell us about your lost item</p>
              <p className="text-sm text-slate-500"><span className="font-semibold text-slate-700"><span aria-hidden="true" className="text-red-500">*</span> Required.</span> Provide details to help staff locate your item.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Item Category <span aria-hidden="true" className="text-red-500">*</span></label>
              <select required value={form.category} onChange={updateForm('category')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors hover:border-brand/40 hover:bg-white focus:border-brand">
                <option value="" disabled>Select item category...</option>
                {itemCategories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Select Bus Route <span aria-hidden="true" className="text-red-500">*</span></label>
              <select required value={form.routeId} onChange={(event) => setForm((current) => ({ ...current, routeId: event.target.value, busId: '' }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors hover:border-brand/40 hover:bg-white focus:border-brand">
                <option value="" disabled>Select Bus Route...</option>
                {routes.filter((route) => route.status === 'Active').map((route) => (
                  <option key={route.id} value={route.id}>{route.id} · {route.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Bus Number <span className="font-normal text-slate-400">(optional)</span></label>
              <select value={form.busId} onChange={(event) => setForm((current) => ({ ...current, busId: event.target.value, otherBus: '' }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors hover:border-brand/40 hover:bg-white focus:border-brand">
                <option value="">Bus unknown / not listed</option>
                {availableBuses.map((bus) => <option key={bus.id} value={bus.id}>{bus.id} · {bus.plate}</option>)}
                <option value="other">Other unit...</option>
              </select>
              {form.busId === 'other' && (
                <>
                  <label htmlFor="other-bus-number" className="mb-1 mt-2 block text-sm font-semibold text-slate-700">Other bus number <span aria-hidden="true" className="text-red-500">*</span></label>
                  <input id="other-bus-number" required value={form.otherBus} onChange={updateForm('otherBus')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors hover:border-brand/40 hover:bg-white focus:border-brand" placeholder="Enter bus number or plate" />
                </>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Other identifying details <span className="font-normal text-slate-400">(optional)</span></label>
              <input value={form.identifyingDetails} onChange={updateForm('identifyingDetails')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors hover:border-brand/40 hover:bg-white focus:border-brand" placeholder="Color, brand, distinguishing marks..." />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Travel Date <span aria-hidden="true" className="text-red-500">*</span></label>
              <input required type="date" value={form.date} onChange={updateForm('date')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors hover:border-brand/40 hover:bg-white focus:border-brand" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Time <span aria-hidden="true" className="text-red-500">*</span></label>
              <input required type="time" value={form.time} onChange={updateForm('time')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors hover:border-brand/40 hover:bg-white focus:border-brand" />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-navy">Estimated Location / Terminal / Seat Position <span aria-hidden="true" className="text-red-500">*</span></label>
            <div className="flex h-12 items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 transition-colors hover:border-brand/40 hover:bg-blue-50/40 sm:h-auto sm:border-slate-200 sm:bg-slate-50 sm:py-2.5 sm:hover:border-brand/40 sm:hover:bg-white">
              <MapPin size={16} className="shrink-0 text-brand sm:hidden" />
              <select required value={form.location} onChange={updateForm('location')} className="min-w-0 w-full border-0 bg-transparent text-sm text-slate-700 outline-none">
                <option value="" disabled>Choose a stop or terminal...</option>
                {availableStops.map((stop) => <option key={stop.id} value={stop.name}>{stop.name}</option>)}
                <option value="other">Other location...</option>
              </select>
              <MapPin size={16} className="hidden shrink-0 text-slate-400 sm:block" />
            </div>
            {form.location === 'other' && (
              <input required value={form.otherLocation} onChange={updateForm('otherLocation')} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors hover:border-brand/40 hover:bg-white focus:border-brand" placeholder="Enter location or seat position" />
            )}
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-navy">Item Description <span aria-hidden="true" className="text-red-500">*</span></label>
            <textarea required rows={4} value={form.description} onChange={updateForm('description')} className="h-24 w-full resize-none rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 hover:border-brand/40 focus:border-brand md:h-32 md:resize-y md:border-slate-200 md:bg-slate-50" placeholder="Describe the item, including color, brand, marks, and contents..." />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-navy">Reference Photo or Proof of Ownership <span className="font-normal text-slate-500">(optional)</span></label>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={(event) => setPhoto(event.target.files?.[0] || null)} className="sr-only" />
            <div className="flex min-h-[72px] flex-col items-start justify-center gap-2 rounded-xl border border-dashed border-blue-200 bg-slate-50 px-3 py-2 transition-colors hover:border-brand/50 hover:bg-blue-50/60 sm:min-h-0 sm:flex-row sm:items-center sm:gap-3 sm:border-slate-300 sm:py-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="group flex w-full items-center gap-3 rounded-lg text-left text-sm font-semibold text-slate-700 transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:hidden">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/70 text-brand transition-colors group-hover:bg-blue-100"><Upload size={18} /></span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">Choose a file</span>
                  <span className="truncate text-xs font-normal text-slate-500">{photo?.name || 'Image or PDF'}</span>
                </span>
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand/30 hover:bg-blue-50 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:inline-flex">
                <Upload size={16} />
                Choose a file
              </button>
              <span className="hidden min-w-0 flex-1 truncate text-sm text-slate-500 sm:block">{photo?.name || 'Image or PDF'}</span>
              {photo && <button type="button" onClick={() => { setPhoto(null); fileInputRef.current.value = '' }} aria-label="Remove selected file" className="rounded-lg p-2 text-slate-500 hover:bg-slate-200"><X size={16} /></button>}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-navy">Contact Phone <span aria-hidden="true" className="text-red-500">*</span></label>
              <div className="flex h-12 flex-nowrap items-center overflow-hidden rounded-xl border border-blue-100 bg-white transition-colors hover:border-brand/40 sm:h-auto sm:gap-2 sm:border-slate-200 sm:bg-slate-50 sm:px-3 sm:py-2.5">
                <span className="inline-flex h-full w-[54px] min-w-[54px] flex-none items-center justify-center whitespace-nowrap border-r border-blue-100 bg-slate-50 px-3 text-sm font-bold leading-none text-slate-800 sm:h-auto sm:w-auto sm:min-w-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pr-2 sm:font-semibold">+63</span>
                <input required type="tel" inputMode="numeric" pattern="[0-9 +()-]{7,16}" value={form.phone} onChange={updateForm('phone')} className="h-full min-w-0 flex-1 border-0 bg-white px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 hover:bg-blue-50/30 focus:bg-blue-50/30 sm:h-auto sm:bg-transparent sm:px-0 sm:hover:bg-transparent sm:focus:bg-transparent" placeholder="9171234567" />
              </div>
            </div>

          </div>

          <div className="mt-4 grid grid-cols-[0.9fr_1.7fr] gap-2 sm:flex sm:flex-nowrap sm:items-center sm:justify-end sm:gap-3">
            <button type="button" onClick={resetForm} className="h-12 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-brand transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-100 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 sm:h-auto sm:px-4 sm:py-2.5 sm:text-sm sm:text-slate-700">
              Clear form
            </button>
            <button type="submit" className="h-12 shrink-0 whitespace-nowrap rounded-xl bg-brand px-2 text-xs font-bold text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-brand/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 active:translate-y-0 sm:h-auto sm:px-4 sm:py-2.5 sm:text-sm">
              Submit Lost Item Report
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-black text-navy">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <ShieldCheck size={16} />
                </div>
                Official QC Bus Commuter Protection Program
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-bold text-navy">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white text-[10px]">R</div>
                  <span>My Recent Inquiries</span>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 sm:tracking-[0.1em]">Oct 2026</span>
              </div>
            </div>

            <div className="space-y-3">
              {recentInquiries.map((inquiry) => (
              <div key={inquiry.id}>
                <article className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand"><Package size={20} /></span>
                      <h3 className="truncate text-base font-bold text-navy">{inquiry.title}</h3>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${inquiry.status === 'Ready' ? 'bg-green-100 text-green-700' : inquiry.status === 'Claimed' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>{inquiry.status}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Bus</p>
                      <p className="mt-0.5 text-base font-bold text-navy">{inquiry.bus}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Date reported</p>
                      <p className="mt-0.5 text-base font-bold text-navy">{inquiry.date}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => copyCaseReference(inquiry.id)} aria-label={`${copiedCaseRef === inquiry.id ? 'Copied' : 'Copy'} case reference ${inquiry.id}`} className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl bg-slate-100 px-3 py-2.5 text-left transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Case ref</span>
                      <span className="mt-0.5 block truncate font-mono text-sm font-bold text-navy">{inquiry.id}</span>
                    </span>
                    {copiedCaseRef === inquiry.id ? <Check size={18} className="shrink-0 text-green-600" /> : <Copy size={18} className="shrink-0 text-slate-500" />}
                  </button>
                  <button type="button" aria-haspopup="dialog" onClick={(event) => { detailTriggerRef.current = event.currentTarget; setSelectedInquiry(inquiry) }} className="mt-2 flex min-h-10 w-full items-center justify-end gap-2 text-sm font-bold text-brand transition-colors hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
                    View details <ChevronRight size={18} />
                  </button>
                </article>
              </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-lg font-black text-navy">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
                <CircleAlert size={18} />
              </div>
              How QC Recovery Works
            </div>

            <div className="space-y-4">
              {[
                'Digital intake: Your submission immediately broadcasts to terminal dispatchers and drivers on that specific line.',
                'Depot boarding: Conductors deposit lost items at the QC City Hall Depot and log the item into the transit system.',
                'Secure match & pickup: Upon positive match, present your QC Citizen ID or valid government ID with your digital SMS claim token.',
              ].map((text, idx) => (
                <div key={text} className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{idx + 1}</div>
                  <p className="text-sm leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-brand px-4 py-3 text-white shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-base font-black">
              <Phone size={18} />
              Direct Transit Police &amp; Hotline
            </div>
            <div className="text-lg font-bold">(02) 8888-4242 loc. 8112</div>
            <div className="mt-1 text-sm text-blue-100">QC Hotline 122</div>
          </div>
        </aside>
      </div>
      {selectedInquiry && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedInquiry(null)
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="lost-inquiry-dialog-title" className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Lost item inquiry</p>
                  <h2 id="lost-inquiry-dialog-title" className="mt-1 break-words text-lg font-bold text-navy">{selectedInquiry.title}</h2>
                </div>
              </div>
              <button ref={dialogCloseRef} type="button" onClick={() => setSelectedInquiry(null)} aria-label="Close inquiry details" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <span className="text-sm font-semibold text-slate-600">Inquiry status</span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700">{selectedInquiry.status}</span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ['Case reference', selectedInquiry.id],
                ['Bus', selectedInquiry.bus],
                ['Route', selectedInquiry.route],
                ['Travel date', selectedInquiry.date],
                ['Travel time', selectedInquiry.travelTime],
                ['Location', selectedInquiry.location],
              ].filter(([, value]) => value).map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</p>
                  <p className="mt-1 break-words text-sm font-semibold leading-5 text-slate-800">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <h3 className="text-sm font-bold text-navy">Item description</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedInquiry.description || selectedInquiry.details}</p>
            </div>

            {selectedInquiry.identifyingDetails && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-navy">Additional identifying details</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selectedInquiry.identifyingDetails}</p>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button type="button" onClick={() => setSelectedInquiry(null)} className="min-h-11 rounded-xl bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2">Close</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
