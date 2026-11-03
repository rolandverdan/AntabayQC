import { useEffect, useRef, useState } from 'react'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'
import { useToast } from '../../admin/context/ToastContext.jsx'
import LostItemHeader from '../components/LostItemHeader.jsx'
import Select from '../../shared/components/Select.jsx'
import DatePicker from '../../shared/components/DatePicker.jsx'
import TimePicker from '../../shared/components/TimePicker.jsx'
import BackToSupport from '../components/BackToSupport.jsx'
import { Backpack, Check, ChevronRight, CircleAlert, ClipboardList, Copy, FileText, KeyRound, MapPin, Package, Phone, Shirt, ShieldCheck, Smartphone, Upload, Wallet, X } from 'lucide-react'

// Icon that matches the kind of item (instead of a generic letter avatar).
const itemIcon = (title = '') => {
  const t = title.toLowerCase()
  if (/bag|backpack/.test(t)) return Backpack
  if (/wallet|card/.test(t)) return Wallet
  if (/phone|electronic|laptop|charger/.test(t)) return Smartphone
  if (/key/.test(t)) return KeyRound
  if (/cloth|jacket|umbrella|accessor/.test(t)) return Shirt
  if (/document|id\b|paper/.test(t)) return FileText
  return Package
}

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
  const { routes, buses, stops, addReport } = useAdminData()
  const { notify } = useToast()
  const fileInputRef = useRef(null)
  const detailTriggerRef = useRef(null)
  const dialogCloseRef = useRef(null)
  const [form, setForm] = useState(makeInitialForm)
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
      <LostItemHeader description="File an inquiry, track depot verification, and claim recovered items." />

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
              <Select required value={form.category} onChange={updateForm('category')} className="rounded-xl border-slate-200 bg-slate-50 hover:border-brand/40 hover:bg-white">
                <option value="">Select item category...</option>
                {itemCategories.map((category) => <option key={category}>{category}</option>)}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Select Bus Route <span aria-hidden="true" className="text-red-500">*</span></label>
              <Select required value={form.routeId} onChange={(event) => setForm((current) => ({ ...current, routeId: event.target.value, busId: '' }))} className="rounded-xl border-slate-200 bg-slate-50 hover:border-brand/40 hover:bg-white">
                <option value="">Select Bus Route...</option>
                {routes.filter((route) => route.status === 'Active').map((route) => (
                  <option key={route.id} value={route.id} data-desc={route.name}>{route.id}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Bus Number <span className="font-normal text-slate-400">(optional)</span></label>
              <Select value={form.busId} onChange={(event) => setForm((current) => ({ ...current, busId: event.target.value, otherBus: '' }))} className="rounded-xl border-slate-200 bg-slate-50 hover:border-brand/40 hover:bg-white">
                <option value="">Bus unknown / not listed</option>
                {availableBuses.map((bus) => <option key={bus.id} value={bus.id}>{bus.id} · {bus.plate}</option>)}
                <option value="other">Other unit...</option>
              </Select>
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
              <DatePicker required value={form.date} onChange={updateForm('date')} className="rounded-xl border-slate-200 bg-slate-50 hover:border-brand/40 hover:bg-white" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Time <span aria-hidden="true" className="text-red-500">*</span></label>
              <TimePicker required value={form.time} onChange={updateForm('time')} className="rounded-xl border-slate-200 bg-slate-50 hover:border-brand/40 hover:bg-white" />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-navy">Estimated Location / Terminal / Seat Position <span aria-hidden="true" className="text-red-500">*</span></label>
            <Select required value={form.location} onChange={updateForm('location')} leading={<MapPin size={16} className="shrink-0 text-brand" aria-hidden="true" />} className="rounded-xl border-slate-200 bg-slate-50 hover:border-brand/40 hover:bg-white">
              <option value="">Choose a stop or terminal...</option>
              {availableStops.map((stop) => <option key={stop.id} value={stop.name}>{stop.name}</option>)}
              <option value="other">Other location...</option>
            </Select>
            {form.location === 'other' && (
              <input required value={form.otherLocation} onChange={updateForm('otherLocation')} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors hover:border-brand/40 hover:bg-white focus:border-brand" placeholder="Enter location or seat position" />
            )}
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-navy">Item Description <span aria-hidden="true" className="text-red-500">*</span></label>
            <textarea required rows={3} value={form.description} onChange={updateForm('description')} className="h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 hover:border-brand/40 hover:bg-white focus:border-brand" placeholder="Describe the item, including color, brand, marks, and contents..." />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-navy">Reference Photo or Proof of Ownership <span className="font-normal text-slate-500">(optional)</span></label>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={(event) => setPhoto(event.target.files?.[0] || null)} className="sr-only" />
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-blue-200 bg-slate-50 px-3 py-2.5 transition-colors hover:border-brand/50 hover:bg-blue-50/60">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left text-sm font-semibold text-slate-700 transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/70 text-brand transition-colors group-hover:bg-blue-100"><Upload size={18} /></span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-brand">Choose a file</span>
                  <span className="truncate text-xs font-normal text-slate-500">{photo?.name || 'Image or PDF'}</span>
                </span>
              </button>
              {photo && <button type="button" onClick={() => { setPhoto(null); fileInputRef.current.value = '' }} aria-label="Remove selected file" className="rounded-lg p-2 text-slate-500 hover:bg-slate-200"><X size={16} /></button>}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-navy">Contact Phone <span aria-hidden="true" className="text-red-500">*</span></label>
              <div className="flex h-12 flex-nowrap items-stretch overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-colors hover:border-brand/40 focus-within:border-brand">
                <span className="inline-flex h-full shrink-0 items-center justify-center whitespace-nowrap border-r border-slate-200 bg-slate-100 px-3.5 text-sm font-bold leading-none text-navy sm:rounded-l-lg">+63</span>
                <input required type="tel" inputMode="numeric" pattern="[0-9 +()-]{7,16}" value={form.phone} onChange={updateForm('phone')} className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400" placeholder="9171234567" />
              </div>
            </div>

          </div>

          <div className="mt-5 flex items-center gap-3 sm:justify-end">
            <button type="button" onClick={resetForm} className="h-12 shrink-0 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-brand transition-all duration-150 hover:border-slate-300 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2">
              Clear form
            </button>
            <button type="submit" className="h-12 min-w-0 flex-1 whitespace-nowrap rounded-xl bg-brand px-3 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-brand/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 sm:flex-none sm:px-6">
              Submit Lost Item Report
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2.5 text-sm font-bold leading-snug text-navy">
                <ShieldCheck size={20} className="shrink-0 text-sky-500" aria-hidden="true" />
                Official QC Bus Commuter Protection Program
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2 text-base font-bold text-navy">
                <ClipboardList size={18} className="text-brand" aria-hidden="true" />
                <span>My Recent Inquiries</span>
              </div>
              <span className="text-xs font-semibold text-slate-500">Oct 2026</span>
            </div>

            <div className="space-y-3">
              {recentInquiries.map((inquiry) => (
              <div key={inquiry.id}>
                <article className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand">{(() => { const Icon = itemIcon(inquiry.title); return <Icon size={20} aria-hidden="true" /> })()}</span>
                      <h3 className="truncate text-base font-bold text-navy">{inquiry.title}</h3>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold tracking-normal ${inquiry.status === 'Ready' ? 'bg-green-100 text-green-700' : inquiry.status === 'Claimed' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>{inquiry.status}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bus</p>
                      <p className="mt-0.5 text-base font-bold text-navy">{inquiry.bus}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date reported</p>
                      <p className="mt-0.5 text-base font-bold text-navy">{inquiry.date}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => copyCaseReference(inquiry.id)} aria-label={`${copiedCaseRef === inquiry.id ? 'Copied' : 'Copy'} case reference ${inquiry.id}`} className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl bg-slate-100 px-3 py-2.5 text-left transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Case ref</span>
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
