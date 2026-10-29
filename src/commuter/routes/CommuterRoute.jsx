import { Navigate, useLocation } from 'react-router-dom'
import { useCommuter } from '../context/CommuterContext.jsx'
import { GUEST_HOME, isGuestAllowed } from '../layouts/navItems.js'

// Frontend-only route guard. It is NOT production security.
export default function CommuterRoute({ children }) {
  const { session } = useCommuter()
  const location = useLocation()
  if (!session) return <Navigate to="/" replace state={{ from: location.pathname }} />
  // Guests can only open the live map; send every other commuter URL there.
  if (session.mode === 'guest' && !isGuestAllowed(location.pathname)) return <Navigate to={GUEST_HOME} replace />
  return children
}
