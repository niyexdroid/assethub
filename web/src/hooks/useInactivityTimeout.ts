import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

const TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Logs the user out after 15 minutes of inactivity.
 * Monitors mouse, keyboard, touch, scroll events + tab visibility.
 * Background-tab time is tracked via Date.now() to handle timer throttling.
 */
export function useInactivityTimeout() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const clearAuth = useAuthStore(s => s.clearAuth)
  const navigate = useNavigate()
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const hiddenAt = useRef<number>(0)

  useEffect(() => {
    if (!isAuthenticated) return

    const schedule = () => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        clearAuth()
        navigate('/login')
      }, TIMEOUT_MS)
    }

    const onActivity = () => schedule()

    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt.current = Date.now()
        clearTimeout(timerRef.current)
      } else {
        const elapsed = Date.now() - hiddenAt.current
        if (hiddenAt.current && elapsed >= TIMEOUT_MS) {
          clearAuth()
          navigate('/login')
          return
        }
        schedule()
      }
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const
    events.forEach(e => document.addEventListener(e, onActivity, { passive: true }))
    document.addEventListener('visibilitychange', onVisibility)
    schedule()

    return () => {
      clearTimeout(timerRef.current)
      events.forEach(e => document.removeEventListener(e, onActivity))
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [isAuthenticated, clearAuth, navigate])
}
