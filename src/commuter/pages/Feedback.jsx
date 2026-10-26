import { useState } from 'react'
import { MessageSquareText, Star, Send, CheckCircle2 } from 'lucide-react'
import { useAdminData } from '../../admin/context/AdminDataContext.jsx'
import { useToast } from '../../admin/context/ToastContext.jsx'
import { PageHeader } from '../../admin/components/Card.jsx'

const ratingOptions = [1, 2, 3, 4, 5]
const categories = ['Driver behavior', 'Route reliability', 'Bus cleanliness', 'Schedule and timing', 'Station experience', 'Accessibility', 'Other']
const today = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const createInitialForm = () => ({
  category: '',
  routeId: '',
  busId: '',
  otherBus: '',
  rating: 0,
  details: '',
  date: today(),
})

export default function Feedback() {
  const { routes, buses } = useAdminData()
  const { notify } = useToast()
  const [form, setForm] = useState(createInitialForm)
  const [recentFeedback, setRecentFeedback] = useState([
    { title: 'Driver courtesy improved', meta: 'QC Hall ↔ Cubao', value: '4.8/5' },
    { title: 'Schedule reliability', meta: 'Batasan ↔ Katipunan', value: '4.2/5' },
    { title: 'Cleanliness on board', meta: 'Commonwealth route', value: '4.5/5' },
  ])
  const availableBuses = buses.filter((bus) => bus.status === 'Active' && (!form.routeId || bus.routeId === form.routeId))

  const updateForm = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const clearForm = () => {
    setForm(createInitialForm())
    notify('Feedback form cleared.', 'info')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!form.rating) {
      notify('Choose a star rating before submitting feedback.', 'error')
      return
    }
    const route = routes.find((item) => item.id === form.routeId)
    const bus = buses.find((item) => item.id === form.busId)
    const feedback = {
      title: form.category,
      meta: route?.name || 'Route not specified',
      value: `${form.rating}/5`,
      details: form.details,
      bus: bus ? `${bus.id} · ${bus.plate}` : form.otherBus,
    }
    setRecentFeedback((items) => [feedback, ...items])
    setForm(createInitialForm())
    notify('Demo feedback added to Recent Feedback. It has not been sent to a service.', 'success')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Feedback"
        description="Help us improve service quality, route reliability, and your commuter experience."
        actions={<div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <MessageSquareText size={16} />
            </div>
            <div>
              <div className="font-bold text-slate-800">Customer Experience</div>
              <div className="text-xs text-slate-500">Last response: 2 hours ago</div>
            </div>
          </div>}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <form onSubmit={handleSubmit} className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
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
              <label htmlFor="feedback-category" className="mb-1 block text-sm font-semibold text-slate-700">Feedback category</label>
              <select id="feedback-category" required value={form.category} onChange={updateForm('category')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand">
                <option value="">Select feedback category...</option>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="feedback-route" className="mb-1 block text-sm font-semibold text-slate-700">Route / line</label>
              <select id="feedback-route" value={form.routeId} onChange={(event) => setForm((current) => ({ ...current, routeId: event.target.value, busId: '' }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand">
                <option value="">Select Bus Route...</option>
                {routes.filter((route) => route.status === 'Active').map((route) => (
                  <option key={route.id} value={route.id}>{route.id} · {route.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label id="feedback-rating-label" className="mb-1 block text-sm font-semibold text-slate-700">How would you rate your trip? <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3" role="group" aria-labelledby="feedback-rating-label">
                {ratingOptions.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, rating: value }))}
                    aria-label={`${value} out of 5 stars`}
                    aria-pressed={form.rating === value}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white transition-all duration-150 hover:-translate-y-0.5 hover:border-amber-400 hover:text-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                      value <= form.rating ? 'border-amber-400 text-amber-500' : 'border-slate-200 text-slate-400'
                    }`}
                  >
                    <Star size={16} fill="currentColor" />
                  </button>
                ))}
                <span role="status" className="text-sm font-semibold text-slate-600">{form.rating ? `${form.rating} / 5` : 'Choose a rating'}</span>
              </div>
            </div>

            <div>
              <label htmlFor="feedback-details" className="mb-1 block text-sm font-semibold text-slate-700">Tell us more</label>
              <textarea id="feedback-details" required minLength={5} rows={6} value={form.details} onChange={updateForm('details')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" placeholder="Share what went well, what needs improvement, and how we can make the trip better." />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="feedback-bus" className="mb-1 block text-sm font-semibold text-slate-700">Bus number</label>
                <select id="feedback-bus" value={form.busId} onChange={(event) => setForm((current) => ({ ...current, busId: event.target.value, otherBus: '' }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand">
                  <option value="">Bus unknown / not listed</option>
                  {availableBuses.map((bus) => <option key={bus.id} value={bus.id}>{bus.id} · {bus.plate}</option>)}
                  <option value="other">Other bus...</option>
                </select>
                {form.busId === 'other' && <input aria-label="Other bus number" required value={form.otherBus} onChange={updateForm('otherBus')} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" placeholder="Enter bus number" />}
              </div>

              <div>
                <label htmlFor="feedback-date" className="mb-1 block text-sm font-semibold text-slate-700">Date of trip</label>
                <input id="feedback-date" required type="date" value={form.date} onChange={updateForm('date')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={clearForm} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-100 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2">
                Clear
              </button>
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-brand/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 active:translate-y-0">
                Submit Feedback <Send size={16} />
              </button>
            </div>
          </div>
        </form>

        <aside className="space-y-5">
          <div className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-lg font-black text-navy">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
                <CheckCircle2 size={18} />
              </div>
              Recent feedback
            </div>

            <div className="space-y-3">
              {recentFeedback.length ? recentFeedback.map((item, index) => (
                <details key={`${item.title}-${index}`} className="group rounded-xl border border-slate-200 bg-slate-50 p-3 open:bg-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-bold text-navy marker:hidden">
                    <span>{item.title}</span>
                    <span className="text-xs font-bold text-brand">{item.value}</span>
                  </summary>
                  <div className="mt-2 text-xs text-slate-500">{item.meta}</div>
                  {item.details && <p className="mt-2 text-sm leading-5 text-slate-600">{item.details}</p>}
                  {item.bus && <p className="mt-1 text-xs text-slate-500">{item.bus}</p>}
                </details>
              )) : (
                <p role="status" className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                  No recent feedback is available yet.
                </p>
              )}
            </div>
          </div>

          <div className="hidden rounded-[18px] border border-slate-200 bg-brand px-4 py-5 text-white shadow-sm md:block">
            <h2 className="text-lg font-black">Service response</h2>
            <p className="mt-3 text-sm leading-6 text-blue-100">
              Your feedback is reviewed by QC Bus operations and service desk teams for route planning, communication, and commuter experience improvements.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
