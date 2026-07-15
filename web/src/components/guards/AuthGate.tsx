import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

const AUTH_PAGES = ['/login', '/register', '/complete-profile', '/google-complete']

export function AuthGate() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const location = useLocation()

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

    if (isAuthenticated && AUTH_PAGES.includes(location.pathname)) {
      // Only redirect when on an auth page (login, register, etc.)
      // Don't redirect when already on an authenticated page
      if (user?.role === 'landlord') {
        navigate('/landlord/dashboard', { replace: true })
      } else {
        navigate('/home', { replace: true })
      }
    }
  }, [isAuthenticated, ready, user?.role, location.pathname, navigate])

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return <Outlet />
}
