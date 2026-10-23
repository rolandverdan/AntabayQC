import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2, CircleAlert, Clock3, FileText, Hash, MapPin, Search, ShieldCheck, Ticket, BellRing, Phone } from 'lucide-react'

const stats = [
  { label: 'Total reports', value: '4', tone: 'default' },
  { label: 'Passed / matched', value: '1', tone: 'green' },
  { label: 'In depot transit', value: '1', tone: 'blue' },
  { label: 'Pending', value: '1', tone: 'amber' },
  { label: 'Claimed', value: '1', tone: 'gray' },
]

const claims = [
  { title: 'Backpack', status: 'Pending', route: 'R-01', bus: 'Bus #1234', date: 'Oct 8, 2026', badge: 'red' },
  { title: 'Wallet & QC Resident Card', status: 'Ready for pickup', route: 'R-01', bus: 'Bus #1234', date: 'Filed Sep 30, 2026', badge: 'green' },
]

export default function LostItemReports() {
  const { pathname } = useLocation()
  const isFormActive = pathname === '/commuter/lost-item'
  const isReportsActive = pathname === '/commuter/lost-item-reports'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-[clamp(2rem,2.3vw,2.8rem)] font-black uppercase tracking-tight text-navy">Lost Item</h1>
          <p className="mt-1 text-sm text-slate-500">File automated inquiries, track real-time depot verification, and claim recovered personal items.</p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <ShieldCheck size={16} />
          </div>
          <div>
            <div className="font-bold text-slate-800">QC Central Terminal Depot</div>
            <div className="text-xs text-slate-500">Open Now • 08:00 – 17:00 PHT</div>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/commuter/lost-item" className={`rounded-xl px-4 py-2 text-sm shadow-sm transition ${isFormActive ? 'bg-brand text-white ring-2 ring-brand/20 hover:bg-brand/90' : 'border border-slate-200 bg-slate-50 font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}>
            Report Lost Item
          </Link>
          <Link to="/commuter/lost-item-reports" className={`rounded-xl px-4 py-2 text-sm shadow-sm transition ${isReportsActive ? 'bg-brand text-white ring-2 ring-brand/20 hover:bg-brand/90' : 'border border-slate-200 bg-slate-50 font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-100'}`}>
            Check My Reports / Claims
          </Link>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_0.75fr]">
        <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <FileText size={18} />
            </div>
            <div>
              <p className="text-xl font-black text-navy">Tell us about your lost item</p>
              <p className="text-sm text-slate-500">Provide specific identifiers so fleet conductors and depot managers can locate your item faster.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Item Category</label>
              <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand">
                <option>Transit Line / Route</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Select Bus Route</label>
              <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand">
                <option>Select Bus Route...</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Bus Fleet / Unit Number</label>
              <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" placeholder="e.g., Bus #1234 or plate letters" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Optional</label>
              <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" placeholder="" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Date &amp; Travel Time Window</label>
              <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" value="10/05/2026" readOnly />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Time</label>
              <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" value="10:00 — 11:00 am" readOnly />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Estimated Location / Terminal / Seat Position</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <input className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" placeholder="Select where you might have left it..." />
              <MapPin size={16} className="text-slate-400" />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Comprehensive Item Description</label>
            <textarea rows={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" placeholder="e.g. Navy blue Herschel Settlement backpack with brown faux-leather bottom. Inside has a silver laptop sleeve, a yellow spiral notebook, and QC University ID under name 'Juan Dela Cruz'." />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Reference Photo or Proof of Ownership</label>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">Reference Photo or Proof of Ownership</div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Contact Phone (for SMS Claim Code)</label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <span className="text-sm font-semibold text-slate-700">+63</span>
                <input className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" placeholder="" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Transit Line / Route</label>
              <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand">
                <option>Select Bus Route...</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Clear Form</button>
            <button className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm">Submit Lost Item Report</button>
          </div>
        </div>

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
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-red-500 text-xs font-bold text-white">R</span>
                    <span className="text-sm font-bold text-navy">Backpack</span>
                  </div>
                  <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-red-600">Pending</span>
                </div>
                <div className="mt-2 text-xs text-slate-500">Bus #1234 • Oct 8, 2026</div>
                <div className="mt-2 text-xs text-slate-500">Found by Conductor #C-109</div>
                <button className="mt-3 text-xs font-semibold text-brand">View details</button>
              </div>
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
