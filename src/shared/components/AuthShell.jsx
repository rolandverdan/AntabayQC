import { CircleAlert, CircleCheck } from 'lucide-react'
import BrandBackdrop, { SILHOUETTE_CLASS, SILHOUETTE_FADE } from './BrandBackdrop.jsx'
import { LogoTile } from './Logo.jsx'

/**
 * Shared login / access layout, reproduced from the Admin login page so all three roles look identical:
 *  - lg+: split screen with the blue silhouette panel on the left and the form card on the right
 *  - below lg: the same silhouette sits softly behind the form card
 */
export default function AuthShell({ role, heading, blurb, footer, children }) {
  return (
    <div className="mobile-ui grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand p-10 text-white lg:flex">
        <BrandBackdrop />
        <div className="relative z-10 flex items-center gap-3">
          <LogoTile />
          <div>
            <p className="text-lg font-bold tracking-wide">ANTABAY QC</p>
            <p className="text-xs text-blue-200">GIS-based Bus Tracking · Quezon City</p>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold leading-tight">{heading}</h2>
          <p className="mt-3 max-w-md text-sm text-blue-100">{blurb}</p>
        </div>
        <p className="relative z-10 text-xs text-blue-200">{footer}</p>
      </div>

      <div className="pt-safe pb-safe relative flex items-center justify-center overflow-hidden bg-brand p-4 sm:p-6 lg:bg-surface">
        <img
          src="/images/quezon-memorial-circle.png"
          alt=""
          aria-hidden="true"
          style={SILHOUETTE_FADE}
          className={`absolute inset-0 h-full w-full opacity-40 lg:hidden ${SILHOUETTE_CLASS}`}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand/60 to-brand-dark/80 lg:hidden" />

        <div className="relative z-10 w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-8 lg:shadow-sm">
            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <LogoTile size="sm" />
              <div className="leading-tight">
                <p className="font-bold text-navy">ANTABAY QC</p>
                <p className="text-[11px] text-slate-500">{role}</p>
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function FormFeedback({ feedback }) {
  if (!feedback) return null
  return (
    <div role="alert" className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${feedback.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
      {feedback.type === 'error' ? <CircleAlert size={16} /> : <CircleCheck size={16} />}
      {feedback.text}
    </div>
  )
}
