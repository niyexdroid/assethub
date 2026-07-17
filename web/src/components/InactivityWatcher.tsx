import { useInactivityTimeout } from '@/hooks/useInactivityTimeout'

/** Mounts inside authenticated routes — auto-logout after 15 min inactivity. */
export function InactivityWatcher() {
  useInactivityTimeout()
  return null
}
