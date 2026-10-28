// The official ANTABAY QC logo (public/images/antabay-qc-logo.svg).
export default function Logo({ className = 'h-10 w-auto', alt = 'ANTABAY QC logo' }) {
  return <img src="/images/antabay-qc-logo.svg" alt={alt} className={`select-none object-contain ${className}`} draggable="false" />
}

// The logo shown directly on the blue header / panels, with no background box.
// The artwork has dark navy parts (wordmark, wheels), so a thin white outline keeps them readable on blue.
const HALO = '[filter:drop-shadow(0_0_1px_#fff)_drop-shadow(0_0_2px_rgba(255,255,255,0.9))]'

export function LogoTile({ size = 'md', className = '' }) {
  const box = size === 'lg' ? 'h-24' : size === 'sm' ? 'h-12' : 'h-14'
  return (
    <span className={`flex shrink-0 items-center justify-center ${box} ${className}`}>
      <Logo className={`h-full w-auto ${HALO}`} alt="" />
    </span>
  )
}
