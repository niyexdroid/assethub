import { useCallback, useEffect, useState } from 'react'
import { CreditCard, Building2, MessageSquare, Bell, CheckCheck } from 'lucide-react'
import { notificationsService } from '@/services/notifications.service'
import type { AppNotification } from '@/types/notification'
import { EmptyState } from '@/components/custom/EmptyState'
import { ErrorState } from '@/components/custom/ErrorState'
import { timeAgo } from '@/lib/utils'

const typeIcon = (type: string) => {
  switch (type) {
    case 'payment': return <CreditCard className="w-4 h-4" />
    case 'tenancy': return <Building2 className="w-4 h-4" />
    case 'complaint': return <MessageSquare className="w-4 h-4" />
    default: return <Bell className="w-4 h-4" />
  }
}

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [markingAll, setMarkingAll] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await notificationsService.list()
      setNotifs(data)
    } catch {
      setError('Could not load notifications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsService.markRead(id)
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
    } catch { /* silently fail */ }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await notificationsService.markAllRead()
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch { /* silently fail */ }
    finally { setMarkingAll(false) }
  }

  const unreadCount = notifs.filter((n) => !n.is_read).length

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-3">
        <div className="h-8 bg-muted rounded w-32 animate-pulse mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead} disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You're all caught up! Notifications about your tenancy, payments, and complaints will appear here."
          icon={<Bell className="w-12 h-12 text-muted-foreground" />}
        />
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                n.is_read ? 'bg-card' : 'bg-primary/5 border-primary/20'
              }`}
            >
              <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                n.is_read ? 'bg-muted' : 'bg-primary/10'
              }`}>
                <span className={n.is_read ? 'text-muted-foreground' : 'text-primary'}>
                  {typeIcon(n.type)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{n.title}</span>
                  {!n.is_read && <span className="shrink-0 w-2 h-2 rounded-full bg-primary" />}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
