import { MessageSquareText, Star, Send, CheckCircle2, ArrowRight } from 'lucide-react'

const ratingOptions = [1, 2, 3, 4, 5]

export default function Feedback() {
  return (
    <div className="space-y-5">
      <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[clamp(2rem,2.3vw,2.8rem)] font-black uppercase tracking-tight text-navy">Feedback</h1>
            <p className="mt-1 text-sm text-slate-500">Help us improve service quality, route reliability, and commuter experience.</p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <MessageSquareText size={16} />
            </div>
            <div>
              <div className="font-bold text-slate-800">Customer Experience</div>
              <div className="text-xs text-slate-500">Last response: 2 hours ago</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <MessageSquareText size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-navy">Share your experience</p>
              <p className="text-sm text-slate-500">We review every commuter submission to improve city bus service.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Feedback category</label>
              <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand">
                <option>Driver behavior</option>
                <option>Route reliability</option>
                <option>Bus cleanliness</option>
                <option>Schedule and timing</option>
                <option>Station experience</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Route / line</label>
              <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand">
                <option>Select Bus Route...</option>
                <option>R-01 QC Hall ↔ Cubao</option>
                <option>R-02 QC Hall ↔ Commonwealth</option>
                <option>R-03 Cubao ↔ Katipunan</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">How would you rate your trip?</label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                {ratingOptions.map((value) => (
                  <button key={value} type="button" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-brand hover:text-brand">
                    <Star size={16} fill="currentColor" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Tell us more</label>
              <textarea rows={6} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" placeholder="Share what went well, what needs improvement, and how we can make the trip better." />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Bus number</label>
                <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" placeholder="e.g. Bus #124" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Date of trip</label>
                <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" placeholder="MM/DD/YYYY" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Clear</button>
              <button className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm">
                Submit Feedback <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-lg font-black text-navy">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
                <CheckCircle2 size={18} />
              </div>
              Recent feedback
            </div>

            <div className="space-y-3">
              {[
                { title: 'Driver courtesy improved', meta: 'QC Hall ↔ Cubao', value: '4.8/5' },
                { title: 'Schedule reliability', meta: 'Batasan ↔ Katipunan', value: '4.2/5' },
                { title: 'Cleanliness on board', meta: 'Commonwealth route', value: '4.5/5' },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-navy">{item.title}</div>
                    <span className="text-xs font-bold text-brand">{item.value}</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">{item.meta}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-brand px-4 py-5 text-white shadow-sm">
            <div className="flex items-center gap-3 text-lg font-black">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <ArrowRight size={18} />
              </div>
              Service response
            </div>
            <p className="mt-3 text-sm leading-6 text-blue-100">
              Your feedback is reviewed by QC Bus operations and service desk teams for route planning, communication, and commuter experience improvements.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
