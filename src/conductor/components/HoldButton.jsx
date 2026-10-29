import { useEffect, useRef, useState } from 'react'

/**
 * Press-and-hold button to prevent accidental activation.
 * Works with mouse, touch, and keyboard (hold Space or Enter).
 * Releasing early cancels. onComplete fires once the hold finishes.
 */
export default function HoldButton({ seconds = 2, onComplete, children, disabled = false, className = '' }) {
  const [progress, setProgress] = useState(0)
  const raf = useRef(null)
  const start = useRef(0)
  const done = useRef(false)

  const stop = () => {
    cancelAnimationFrame(raf.current)
    raf.current = null
    if (!done.current) setProgress(0)
  }

  const tick = () => {
    const p = Math.min(1, (performance.now() - start.current) / (seconds * 1000))
    setProgress(p)
    if (p >= 1) {
      done.current = true
      raf.current = null
      onComplete()
    } else {
      raf.current = requestAnimationFrame(tick)
    }
  }

  const begin = () => {
    if (disabled || raf.current || done.current) return
    start.current = performance.now()
    raf.current = requestAnimationFrame(tick)
  }

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const onKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      if (!e.repeat) begin()
    }
  }
  const onKeyUp = (e) => {
    if (e.key === ' ' || e.key === 'Enter') stop()
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={begin}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onBlur={stop}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative inline-flex min-h-11 select-none touch-none items-center justify-center overflow-hidden rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white outline-none transition hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <span className="absolute inset-y-0 left-0 bg-red-900/60" style={{ width: `${progress * 100}%` }} aria-hidden="true" />
      <span className="relative">{progress > 0 && progress < 1 ? 'Keep holding…' : children}</span>
    </button>
  )
}
