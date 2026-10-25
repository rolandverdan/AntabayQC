import { Navigate, useLocation } from 'react-router-dom'
import { useConductor } from '../context/ConductorContext.jsx'

// Frontend-only route guard. It is NOT production security.
export default function ConductorRoute({ children }) {
  const { session } = useConductor()
  const location = useLocation()
  if (!session) return <Navigate to="/" replace state={{ from: location.pathname }} />
  return children
}
