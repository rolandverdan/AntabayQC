import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  FileText,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Clock3,
  Star,
  Phone,
} from 'lucide-react'

const categoryGuide = [
  { label: 'Driver', desc: 'Driver conduct, route issues, speeding, unsafe driving.' },
  { label: 'Conductor', desc: 'Conductor conduct, staff behavior, route support issues.' },
  { label: 'Passenger', desc: 'Passenger conduct, disputes, safety or misconduct.' },
  { label: 'Bus Condition', desc: 'Air conditioning, ventilation, maintenance, cleanliness.' },
  { label: 'Delay / Schedule', desc: 'Trip delays, missed stops, schedule disruption.' },
  { label: 'Overcrowding', desc: 'Overloaded trips, queue issues, unsafe standing space.' },
  { label: 'Lost Item', desc: 'Item left behind, missing belongings, recovery status.' },
  { label: 'General Concern', desc: 'General complaints, service quality, observations.' },
]

const activeReports = [
  { title: 'AC Malfunction on Route 2 (Bus #5678)', status: 'Under Inspection', tone: 'blue' },
  { title: 'Skipped Stop at Quezon City University', status: 'Resolved', tone: 'green' },
]

export default function Report() {
  return (
    <div className="space-y-5 p-0">
      <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3 text-[clamp(1.8rem,2vw,2.4rem)] font-black tracking-tight text-navy">
          <span>Incident &amp; Commuter Report</span>
        </div>

        <p className="text-sm text-slate-500">
          Let us know about any incident, concern, safety issue, or operational delay experienced on the QC Bus service. All submissions are monitored by the QC Commuter Protection &amp; Safety Office.
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[9px] text-white">
            <Check size={10} />
          </span>
          <span className="font-semibold text-slate-700">QC LGU Hotline 122 • Police Dispatch Active</span>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_0.75fr]">
        <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
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

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Report Category <span className="text-red-500">*</span></label>
              <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand">
                <option>Select concern category...</option>
                <option>Driver</option>
                <option>Conductor</option>
                <option>Passenger</option>
                <option>Bus Condition</option>
                <option>Delay / Schedule</option>
                <option>Overcrowding</option>
                <option>Lost Item</option>
                <option>General Concern</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Bus Fleet / Unit Number</label>
              <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" placeholder="e.g., Bus #1234 or plate letters" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Operational Date</label>
              <div className="relative">
                <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-brand" value="10/05/2026" readOnly />
                <Clock3 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Time</label>
              <div className="relative">
                <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-brand" value="10:00 — 11:00 am" readOnly />
                <Clock3 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Estimated Location / Terminal / Seat Position</label>
              <div className="relative">
                <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm text-slate-700 outline-none focus:border-brand" placeholder="Select where you might have left it..." />
                <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Incident Severity / Urgency <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-3 rounded-xl border border-slate-200 bg-slate-50 p-1">
                {['Low', 'Mid', 'High'].map((level, idx) => (
                  <button
                    key={level}
                    type="button"
                    className={`rounded-lg px-3 py-2 text-sm font-semibold ${idx === 1 ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-600'}`}
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand"
                placeholder="Provide as much detail as possible including what occurred, your description, exact stop or landmark, and circumstances..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Photo / Video / Dashboard Ticket Evidence Upload</label>
              <div className="flex min-h-[110px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
                  <Upload size={18} />
                </div>
                <div>Drag &amp; drop photos, conductor ticket receipt, or video clip</div>
                <div className="mt-1 text-xs text-slate-400">Supports PNG, JPG, MP4 up to 25MB. Ticket timestamp aids exact trip validation.</div>
              </div>
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

            <button type="button" className="relative inline-flex h-7 w-12 items-center rounded-full bg-brand/30 p-1 transition">
              <span className="h-5 w-5 rounded-full bg-white shadow-sm translate-x-5" />
            </button>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Clear Form</button>
            <button className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm">Submit Report</button>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-base font-black text-navy">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <FileText size={16} />
              </div>
              Report Categories Guide
            </div>

            <div className="grid grid-cols-2 gap-3">
              {categoryGuide.map(({ label, desc }) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</div>
                  <div className="text-[11px] leading-4 text-slate-600">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-base font-black text-navy">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <ShieldCheck size={16} />
              </div>
              My Active Reports
            </div>

            <div className="space-y-3">
              {activeReports.map((report) => (
                <div key={report.title} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-bold text-slate-800">{report.title}</div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${report.tone === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {report.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-[#0d5fa8] p-4 text-white shadow-sm">
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
                  <div className="text-base font-bold">(02) 8888-4242</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <Bell size={16} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.12em] text-blue-100">Hotline</div>
                  <div className="text-base font-bold">122</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
