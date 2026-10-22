export default function Field({ label, required, error, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold text-navy">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  )
}
