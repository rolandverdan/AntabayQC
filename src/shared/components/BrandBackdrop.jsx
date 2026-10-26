// The Admin login's blue "Quezon Memorial Circle" silhouette, extracted so every role reuses the exact same treatment:
// grayscale + luminosity blend over the brand blue, faded at the top and bottom edges.
export const SILHOUETTE_CLASS = 'pointer-events-none select-none object-cover object-center grayscale contrast-125 mix-blend-luminosity'
export const SILHOUETTE_FADE = {
  maskImage: 'linear-gradient(to bottom, transparent 0%, #000 25%, #000 75%, transparent 100%)',
  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 25%, #000 75%, transparent 100%)',
}

export default function BrandBackdrop({ opacity = 'opacity-60', className = '', overlay = 'bg-gradient-to-t from-brand-dark/90 via-brand/40 to-brand/70' }) {
  return (
    <>
      <img
        src="/images/quezon-memorial-circle.png"
        alt=""
        aria-hidden="true"
        style={SILHOUETTE_FADE}
        className={`absolute inset-0 h-full w-full ${opacity} ${SILHOUETTE_CLASS} ${className}`}
      />
      <div className={`pointer-events-none absolute inset-0 ${overlay}`} />
    </>
  )
}
