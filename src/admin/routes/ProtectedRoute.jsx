import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Frontend-only route guard. It is NOT production security.
export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Checking administrator access…</div>
  }
  if (!user?.firebaseAuthenticated || user.role !== 'admin') {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }
  return children
}
