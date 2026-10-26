import { Navigate, useLocation } from 'react-router-dom'
import { useCommuter } from '../context/CommuterContext.jsx'

// Frontend-only route guard. It is NOT production security.
export default function CommuterRoute({ children }) {
  const { session } = useCommuter()
  const location = useLocation()
  if (!session) return <Navigate to="/" replace state={{ from: location.pathname }} />
  return children
}
