import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * Positions a floating panel (rendered in a portal, position: fixed) under – or above – its trigger.
 * Closes on outside press, Escape, and when the page/modal scrolls underneath it.
 */
export default function usePopover({ open, onClose, minWidth = 0, maxHeight = 320, gap = 6 }) {
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const [style, setStyle] = useState({ visibility: 'hidden' })

  const place = useCallback(() => {
    const t = triggerRef.current
    if (!t) return
    const r = t.getBoundingClientRect()
    const vh = window.innerHeight
    const vw = window.innerWidth
    const panelH = Math.min(panelRef.current?.offsetHeight || maxHeight, maxHeight)
    const below = vh - r.bottom - gap - 8
    const above = r.top - gap - 8
    const openUp = below < Math.min(panelH, 220) && above > below
    const width = Math.max(r.width, minWidth)
    const left = Math.max(8, Math.min(r.left, vw - width - 8))
    setStyle({
      position: 'fixed',
      left,
      width,
      maxHeight: Math.max(160, Math.min(maxHeight, openUp ? above : below)),
      ...(openUp ? { bottom: vh - r.top + gap } : { top: r.bottom + gap }),
      visibility: 'visible',
    })
  }, [gap, maxHeight, minWidth])

  useLayoutEffect(() => {
    if (open) place()
  }, [open, place])

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return
      onClose()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); triggerRef.current?.focus() }
    }
    const onScroll = (e) => {
      if (panelRef.current?.contains(e.target)) return
      place()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, onClose, place])

  return { triggerRef, panelRef, style, place }
}
