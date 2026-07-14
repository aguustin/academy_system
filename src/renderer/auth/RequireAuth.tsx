import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function RequireAuth(): React.JSX.Element | null {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.mustChangePassword) return <Navigate to="/cambiar-contrasena" replace />
  if (user.role === 'teacher' && location.pathname === '/') {
    return <Navigate to="/mis-cursos" replace />
  }

  return <Outlet />
}

export function RequireChangePassword({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element | null {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!user.mustChangePassword) return <Navigate to="/" replace />

  return <>{children}</>
}
