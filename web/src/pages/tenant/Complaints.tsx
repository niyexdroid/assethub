import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MessageSquare, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'
import { complaintsService, type Complaint } from '@/services/complaints.service'
import { timeAgo } from '@/lib/utils'
import { EmptyState } from '@/components/custom/EmptyState'
import { ErrorState } from '@/components/custom/ErrorState'

export default function ComplaintsScreen() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<string>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await complaintsService.list()
      setComplaints(data)
    } catch {
      setError('Could not load complaints.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = filter === 'all' ? complaints : complaints.filter((c) => c.status === filter)

  const statusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />
      case 'escalated': return <AlertTriangle className="w-4 h-4 text-destructive" />
      case 'resolved': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      default: return <MessageSquare className="w-4 h-4 text-muted-foreground" />
    }
  }

  // Stats
  const open = complaints.filter((c) => c.status === 'open' || c.status === 'in_progress').length
  const resolved = complaints.filter((c) => c.status === 'resolved').length
  const escalated = complaints.filter((c) => c.status === 'escalated').length

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h2 text-foreground">Complaints</h1>
        <Link
          to="/complaints/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> New Complaint
        </Link>
      </div>

      {/* Stats + Filters */}
      <div className="flex items-center gap-4 mb-6 overflow-x-auto">
        <button onClick={() => setFilter('all')} className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
          All ({complaints.length})
        </button>
        <button onClick={() => setFilter('open')} className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'open' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
          Open ({open})
        </button>
        <button onClick={() => setFilter('escalated')} className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'escalated' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
          Escalated ({escalated})
        </button>
        <button onClick={() => setFilter('resolved')} className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'resolved' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
          Resolved ({resolved})
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={filter === 'all' ? 'No complaints' : `No ${filter} complaints`}
          description={filter === 'all' ? 'You haven\'t filed any complaints yet.' : ''}
          action={
            <Link to="/complaints/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              <Plus className="w-4 h-4" /> File a complaint
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Link
              key={c.id}
              to={`/complaints/${c.id}`}
              className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all group"
            >
              <div className="shrink-0">{statusIcon(c.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-muted text-muted-foreground">
                    {c.category}
                  </span>
                  {c.priority && (
                    <span className={`text-[10px] font-semibold uppercase ${
                      c.priority === 'high' ? 'text-destructive' : c.priority === 'medium' ? 'text-amber-500' : 'text-muted-foreground'
                    }`}>
                      {c.priority}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-foreground mt-1 line-clamp-1">{c.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {timeAgo(c.created_at)} • {c.status.replace('_', ' ')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
