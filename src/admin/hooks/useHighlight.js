import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const EMPTY = new Set()

/**
 * Reads `state.highlight` (a list of row ids) set by the notification drop-down in the header.
 * Returns a Set of ids that should pulse. It clears itself after `ms` so the page settles down again.
 */
export default function useHighlight(ms = 12000) {
  const { state, key } = useLocation()
  const [ids, setIds] = useState(() => (state?.highlight?.length ? new Set(state.highlight) : EMPTY))

  useEffect(() => {
    const list = state?.highlight
    if (!list?.length) return undefined
    setIds(new Set(list))
    const t = setTimeout(() => setIds(EMPTY), ms)
    return () => clearTimeout(t)
    // `key` changes on every navigation, even to the same page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return ids
}
