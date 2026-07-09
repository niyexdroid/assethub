import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

export function AuthGate() {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      // Allow auth pages through
      return
    }

    // Redirect to correct dashboard based on role
    if (user?.role === 'landlord') {
      navigate('/landlord/dashboard', { replace: true })
    } else {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, isLoading, user?.role, navigate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return <Outlet />
}
