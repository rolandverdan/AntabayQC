const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-dark focus-visible:ring-brand/40',
  secondary: 'bg-white text-navy border border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300',
  success: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-300',
  ghost: 'text-brand hover:bg-brand/10 focus-visible:ring-brand/30',
}

export default function Button({ variant = 'primary', size = 'md', icon: Icon, children, className = '', type = 'button', ...rest }) {
  const sz = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${sz} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  )
}

const ICON_TONES = {
  default: 'text-slate-500 hover:bg-slate-100 hover:text-brand',
  danger: 'text-slate-500 hover:bg-red-50 hover:text-red-600',
  success: 'text-slate-500 hover:bg-green-50 hover:text-green-600',
}

export function IconButton({ icon: Icon, title, tone = 'default', ...rest }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={`rounded-md p-1.5 transition ${ICON_TONES[tone]}`}
      {...rest}
    >
      <Icon size={17} />
    </button>
  )
}
