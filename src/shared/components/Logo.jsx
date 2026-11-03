// The official ANTABAY QC logo (public/images/antabay-qc-logo.svg).
export default function Logo({ className = 'h-10 w-auto', alt = 'ANTABAY QC logo', src = '/images/antabay-qc-logo.svg' }) {
  return <img src={src} alt={alt} className={`select-none object-contain ${className}`} draggable="false" />
}

// The logo shown directly on the blue header / panels, with no outline or background box.
// Uses the white-wordmark version (public/images/antabay-qc-logo-white.svg) so "ANTABAY" reads clearly on blue.
export function LogoTile({ size = 'md', className = '' }) {
  const box = size === 'lg' ? 'h-24' : size === 'sm' ? 'h-12' : 'h-14'
  return (
    <span className={`flex shrink-0 items-center justify-center ${box} ${className}`}>
      <Logo src="/images/antabay-qc-logo-white.svg" className="h-full w-auto" alt="" />
    </span>
  )
}
