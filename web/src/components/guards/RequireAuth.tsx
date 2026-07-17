import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { InactivityWatcher } from '@/components/InactivityWatcher'

export function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setReady(true)
      return
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setReady(true)
    })
    return unsub
  }, [])

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <>
      <InactivityWatcher />
      <Outlet />
    </>
  )
}
