import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'
import { useToast } from '../../admin/context/ToastContext.jsx'
import { PageHeader } from '../../admin/components/Card.jsx'
import { CircleAlert, FileText, MapPin, ShieldCheck, Phone, Upload, X } from 'lucide-react'

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
  const { pathname } = useLocation()
  const { routes, buses, stops } = useAdminData()
  const { notify } = useToast()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState(makeInitialForm)
  const [photo, setPhoto] = useState(null)
  const [recentInquiries, setRecentInquiries] = useState([
    {
      id: 'QC-LR-2026-1008',
      title: 'Backpack',
      status: 'Pending',
      bus: 'Bus #1234',
      date: 'Oct 8, 2026',
      details: 'Sample recent inquiry. This is demonstration data.',
    },
  ])
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const isFormActive = pathname === '/commuter/lost-item'
  const isReportsActive = pathname === '/commuter/lost-item-reports'
  const availableBuses = buses.filter((bus) => bus.status === 'Active' && (!form.routeId || bus.routeId === form.routeId))
  const selectedRoute = routes.find((route) => route.id === form.routeId)
  const availableStops = selectedRoute
    ? selectedRoute.stopIds.map((stopId) => stops.find((stop) => stop.id === stopId)).filter(Boolean)
    : stops.filter((stop) => stop.status === 'Active')

  const updateForm = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
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
      details: [
        `${route?.name || 'Route not specified'} · ${form.location === 'other' ? form.otherLocation : form.location}`,
        `Travel date/time: ${form.date} at ${form.time}`,
        form.description,
        form.identifyingDetails && `Additional details: ${form.identifyingDetails}`,
      ].filter(Boolean).join('. '),
    }

    setRecentInquiries((items) => [inquiry, ...items])
    setSelectedInquiry(inquiry)
    setForm(makeInitialForm())
    setPhoto(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    notify(`Demo report ${caseId} added to recent inquiries. It has not been sent to a service.`, 'success')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lost Item"
        description="File an inquiry, track depot verification, and claim recovered items."
        actions={<div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <ShieldCheck size={16} />
          </div>
          <div>
            <div className="font-bold text-slate-800">QC Central Terminal Depot</div>
            <div className="text-xs text-slate-500">Open Now • 08:00 – 17:00 PHT</div>
          </div>
        </div>}
      />

      <div className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/commuter/lost-item" className={`rounded-xl px-4 py-2 text-sm font-bold shadow-sm transition ${isFormActive ? 'bg-brand text-white ring-2 ring-brand/20 hover:bg-brand/90' : 'border border-slate-200 bg-slate-50 font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}>
            Report Lost Item
          </Link>
          <Link to="/commuter/lost-item-reports" className={`rounded-xl px-4 py-2 text-sm shadow-sm transition ${isReportsActive ? 'bg-brand text-white ring-2 ring-brand/20 hover:bg-brand/90' : 'border border-slate-200 bg-slate-50 font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}>
            Check My Reports / Claims
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.5fr_0.75fr]">
        <form onSubmit={handleSubmit} className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <FileText size={18} />
            </div>
            <div>
              <p className="text-xl font-black text-navy">Tell us about your lost item</p>
              <p className="text-sm text-slate-500">Provide specific identifiers so fleet conductors and depot managers can locate your item faster.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Item Category</label>
              <select required value={form.category} onChange={updateForm('category')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand">
                <option value="">Select item category...</option>
                {itemCategories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Select Bus Route</label>
              <select required value={form.routeId} onChange={(event) => setForm((current) => ({ ...current, routeId: event.target.value, busId: '' }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand">
                <option value="">Select Bus Route...</option>
                {routes.filter((route) => route.status === 'Active').map((route) => (
                  <option key={route.id} value={route.id}>{route.id} · {route.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Bus Fleet / Unit Number</label>
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
              <label className="mb-1 block text-sm font-semibold text-slate-700">Other identifying details <span className="font-normal text-slate-400">(optional)</span></label>
              <input value={form.identifyingDetails} onChange={updateForm('identifyingDetails')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" placeholder="Color, brand, distinguishing marks..." />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Date &amp; Travel Time Window</label>
              <input required type="date" value={form.date} onChange={updateForm('date')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Time</label>
              <input required type="time" value={form.time} onChange={updateForm('time')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Estimated Location / Terminal / Seat Position</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <select required value={form.location} onChange={updateForm('location')} className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none">
                <option value="">Choose a stop or terminal...</option>
                {availableStops.map((stop) => <option key={stop.id} value={stop.name}>{stop.name}</option>)}
                <option value="other">Other location...</option>
              </select>
              <MapPin size={16} className="text-slate-400" />
            </div>
            {form.location === 'other' && (
              <input required value={form.otherLocation} onChange={updateForm('otherLocation')} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" placeholder="Enter location or seat position" />
            )}
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Comprehensive Item Description</label>
            <textarea required rows={4} value={form.description} onChange={updateForm('description')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" placeholder="Describe the item, including color, brand, marks, and contents..." />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Reference Photo or Proof of Ownership</label>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={(event) => setPhoto(event.target.files?.[0] || null)} className="sr-only" />
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                <Upload size={16} />
                Choose a file
              </button>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-500">{photo?.name || 'Image or PDF (optional)'}</span>
              {photo && <button type="button" onClick={() => { setPhoto(null); fileInputRef.current.value = '' }} aria-label="Remove selected file" className="rounded-lg p-2 text-slate-500 hover:bg-slate-200"><X size={16} /></button>}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Contact Phone (for SMS Claim Code)</label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <span className="text-sm font-semibold text-slate-700">+63</span>
                <input required type="tel" inputMode="numeric" pattern="[0-9 +()-]{7,16}" value={form.phone} onChange={updateForm('phone')} className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" placeholder="9171234567" />
              </div>
            </div>

          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-100 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2">
              Clear Form
            </button>
            <button type="submit" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-brand/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 active:translate-y-0">
              Submit Lost Item Report
            </button>
          </div>
        </form>

        <aside className="space-y-5">
          <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
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
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Oct 2026</span>
              </div>
            </div>

            <div className="space-y-3">
              {recentInquiries.map((inquiry) => (
              <div key={inquiry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand text-xs font-bold text-white">R</span>
                    <span className="text-sm font-bold text-navy">{inquiry.title}</span>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700">{inquiry.status}</span>
                </div>
                <div className="mt-2 text-xs text-slate-500">{inquiry.bus} · {inquiry.date}</div>
                <div className="mt-1 text-xs text-slate-500">Case Ref: {inquiry.id}</div>
                <button type="button" onClick={() => setSelectedInquiry(selectedInquiry?.id === inquiry.id ? null : inquiry)} className="mt-3 text-xs font-semibold text-brand hover:underline">
                  {selectedInquiry?.id === inquiry.id ? 'Hide details' : 'View details'}
                </button>
                {selectedInquiry?.id === inquiry.id && <p className="mt-2 rounded-lg bg-white p-2 text-xs leading-5 text-slate-600">{inquiry.details}</p>}
              </div>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
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

          <div className="rounded-[18px] border border-slate-200 bg-brand px-4 py-3 text-white shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-base font-black">
              <Phone size={18} />
              Direct Transit Police &amp; Hotline
            </div>
            <div className="text-lg font-bold">(02) 8888-4242 loc. 8112</div>
            <div className="mt-1 text-sm text-blue-100">QC Hotline 122</div>
          </div>
        </aside>
      </div>
    </div>
  )
}
