import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

export function AuthGate() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  // Track hydration using React state + persist API subscription,
  // NOT the store's own _hasHydrated — that may not trigger re-renders
  // when set via useAuthStore.setState() inside onRehydrateStorage.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // May already be hydrated by the time this effect runs
    if (useAuthStore.persist.hasHydrated()) {
      setReady(true)
      return
    }
    // Otherwise wait for the persist middleware to finish
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setReady(true)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!ready) return

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
  }, [isAuthenticated, ready, user?.role, navigate])

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return <Outlet />
}
