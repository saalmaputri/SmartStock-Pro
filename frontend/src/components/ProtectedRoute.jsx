import { Navigate, Outlet } from 'react-router-dom'
import { getUser, isAuthenticated } from '../utils/auth'

export default function ProtectedRoute({ roles }) {
  const user = getUser()

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
