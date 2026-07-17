import { useEffect, useRef, useCallback } from 'react'
import { AppState } from 'react-native'
import { useAuthStore } from '@/store/auth.store'

const TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Logs the user out after 15 minutes of inactivity.
 * Tracks background time via Date.now() so deep-sleep / timer throttle is handled.
 * Touch events captured via onStartShouldSetResponderCapture on the root View.
 */
export function useInactivityTimeout() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const clearAuth = useAuthStore(s => s.clearAuth)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const backgroundedAt = useRef<number>(0)

  const schedule = useCallback(() => {
    clearTimeout(timerRef.current)
    if (isAuthenticated) {
      timerRef.current = setTimeout(() => clearAuth(), TIMEOUT_MS)
    }
  }, [isAuthenticated, clearAuth])

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimeout(timerRef.current)
      return
    }

    schedule()

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // Coming back from background — check elapsed time
        const elapsed = Date.now() - backgroundedAt.current
        if (backgroundedAt.current && elapsed >= TIMEOUT_MS) {
          clearAuth()
          return
        }
        // Still within window — schedule remaining time
        clearTimeout(timerRef.current)
        const remaining = TIMEOUT_MS - elapsed
        timerRef.current = setTimeout(() => clearAuth(), Math.max(remaining, 0))
      } else if (state === 'background') {
        // Going to background — record time, kill JS timer
        backgroundedAt.current = Date.now()
        clearTimeout(timerRef.current)
      }
    })

    return () => {
      clearTimeout(timerRef.current)
      sub.remove()
    }
  }, [isAuthenticated, schedule, clearAuth])

  // Touch handler for the root View — resets the timer on any touch
  const onTouchStart = useCallback(() => {
    schedule()
  }, [schedule])

  return { onTouchStart }
}
