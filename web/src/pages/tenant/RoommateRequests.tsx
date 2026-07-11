import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, X } from 'lucide-react'
import { roommatesService } from '@/services/roommates.service'
import type { RoommateRequest } from '@/types/roommate'
import { EmptyState } from '@/components/custom/EmptyState'
import { ErrorState } from '@/components/custom/ErrorState'
import { timeAgo } from '@/lib/utils'

export default function RoommateRequestsScreen() {
  const [received, setReceived] = useState<RoommateRequest[]>([])
  const [sent, setSent] = useState<RoommateRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'received' | 'sent'>('received')
  const [actingId, setActingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [r, s] = await Promise.all([
        roommatesService.getReceivedRequests(),
        roommatesService.getSentRequests(),
      ])
      setReceived(r)
      setSent(s)
    } catch {
      setError('Could not load requests.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAccept = async (id: string) => {
    setActingId(id)
    setActionError('')
    try { await roommatesService.acceptRequest(id); load() }
    catch (err) { setActionError((err as any)?.response?.data?.message ?? (err as any)?.message ?? 'Could not accept request.') }
    finally { setActingId(null) }
  }

  const handleDecline = async (id: string) => {
    setActingId(id)
    setActionError('')
    try { await roommatesService.declineRequest(id); load() }
    catch (err) { setActionError((err as any)?.response?.data?.message ?? (err as any)?.message ?? 'Could not decline request.') }
    finally { setActingId(null) }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  const pending = received.filter((r) => r.status === 'pending')
  const current = tab === 'received' ? received : sent

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link to="/roommates" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to roommates
      </Link>
      <h1 className="text-h2 text-foreground mb-6">Requests</h1>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('received')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'received' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}>
          Received ({pending.length > 0 ? pending.length : received.length})
        </button>
        <button onClick={() => setTab('sent')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'sent' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}>
          Sent ({sent.length})
        </button>
      </div>

      {actionError && (
        <p className="text-sm text-destructive mb-4 p-3 rounded-lg bg-destructive/10">{actionError}</p>
      )}

      {current.length === 0 ? (
        <EmptyState
          title={tab === 'received' ? 'No received requests' : 'No sent requests'}
          description={tab === 'received' ? 'Roommate requests you receive will appear here.' : 'You haven\'t sent any roommate requests yet.'}
        />
      ) : (
        <div className="space-y-3">
          {current.map((r) => {
            const person = tab === 'received' ? r.sender : r.receiver
            return (
              <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {person?.first_name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">
                    {person ? `${person.first_name} ${person.last_name}` : 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                      r.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                      r.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-600' :
                      'bg-muted text-muted-foreground'
                    }`}>{r.status}</span>
                    {' '}· {timeAgo(r.created_at)}
                  </p>
                </div>
                {tab === 'received' && r.status === 'pending' && (
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => handleAccept(r.id)} disabled={actingId === r.id}
                      className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDecline(r.id)} disabled={actingId === r.id}
                      className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
