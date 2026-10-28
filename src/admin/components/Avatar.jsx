import { UserRound } from 'lucide-react'

const SIZES = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-16 w-16', xl: 'h-24 w-24' }
const ICONS = { sm: 16, md: 20, lg: 30, xl: 44 }

// Profile photo when there is one, otherwise the profile icon.
export default function Avatar({ src, size = 'md', className = '' }) {
  return src ? (
    <img src={src} alt="" className={`${SIZES[size]} shrink-0 rounded-full object-cover ring-1 ring-slate-200 ${className}`} draggable="false" />
  ) : (
    <span className={`${SIZES[size]} flex shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand ring-1 ring-brand/20 ${className}`} aria-hidden="true">
      <UserRound size={ICONS[size]} />
    </span>
  )
}
