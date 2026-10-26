// The official ANTABAY QC logo (public/images/antabay-qc-logo.svg).
// The artwork is multi-colour, so on blue backgrounds it is placed on a white tile (LogoTile).
export default function Logo({ className = 'h-10 w-auto', alt = 'ANTABAY QC logo' }) {
  return <img src="/images/antabay-qc-logo.svg" alt={alt} className={`select-none object-contain ${className}`} draggable="false" />
}

export function LogoTile({ size = 'md', className = '' }) {
  const box = size === 'lg' ? 'h-20 w-20 rounded-2xl p-2' : size === 'sm' ? 'h-10 w-10 rounded-xl p-1' : 'h-12 w-12 rounded-xl p-1.5'
  return (
    <span className={`flex shrink-0 items-center justify-center bg-white shadow-sm ${box} ${className}`}>
      <Logo className="h-full w-full" alt="" />
    </span>
  )
}
