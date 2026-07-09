import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import type { UserRole } from '@/types/auth'

interface Props {
  role: UserRole
}

export function RequireRole({ role }: Props) {
  const { user } = useAuthStore()

  if (!user || user.role !== role) {
    // Redirect to the correct dashboard
    const redirect = user?.role === 'landlord' ? '/landlord/dashboard' : '/home'
    return <Navigate to={redirect} replace />
  }

  return <Outlet />
}
