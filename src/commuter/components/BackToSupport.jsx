import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

// Shown at the top of Lost Item, Incident Report and Feedback so commuters can return to the Support menu in one tap.
export default function BackToSupport() {
  return (
    <Link
      to="/commuter/support"
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-brand transition hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <ArrowLeft size={16} /> Back to Support
    </Link>
  )
}
