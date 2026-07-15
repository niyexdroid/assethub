import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { complaintsService, type Complaint } from '@/services/complaints.service'
import { EmptyState } from '@/components/custom/EmptyState'
import { ErrorState } from '@/components/custom/ErrorState'
import { formatDate } from '@/lib/utils'

type FilterTab = 'all' | 'open' | 'in_progress' | 'resolved' | 'escalated'

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'escalated', label: 'Escalated' },
  { key: 'resolved', label: 'Resolved' },
]

export default function Complaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<FilterTab>('all')

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

  const filtered = useMemo(() => {
    if (tab === 'all') return complaints
    return complaints.filter((c) => c.status === tab)
  }, [complaints, tab])

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      open: 'bg-blue-500/10 text-blue-600',
      in_progress: 'bg-amber-500/10 text-amber-600',
      resolved: 'bg-emerald-500/10 text-emerald-600',
      escalated: 'bg-destructive/10 text-destructive',
    }
    return map[status] ?? 'bg-muted text-muted-foreground'
  }

  const priorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      low: 'bg-muted text-muted-foreground',
      medium: 'bg-amber-500/10 text-amber-600',
      high: 'bg-destructive/10 text-destructive',
    }
    return map[priority] ?? 'bg-muted text-muted-foreground'
  }

  const counts = useMemo(() => {
    const c: Record<FilterTab, number> = { all: complaints.length, open: 0, in_progress: 0, resolved: 0, escalated: 0 }
    complaints.forEach((co) => {
      if (co.status === 'open') c.open++
      else if (co.status === 'in_progress') c.in_progress++
      else if (co.status === 'resolved') c.resolved++
      else if (co.status === 'escalated') c.escalated++
    })
    return c
  }, [complaints])

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="h-8 bg-muted rounded w-48 animate-pulse mb-4" />
        <div className="h-10 bg-muted rounded w-96 animate-pulse mb-6" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-h2 text-foreground">Complaints</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage tenant complaints and maintenance requests.</p>
      </div>

      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-muted/50 w-fit flex-wrap">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="w-12 h-12" />}
          title={tab === 'all' ? 'No complaints yet' : `No ${tab.replace('_', ' ')} complaints`}
          description={tab === 'all' ? 'Complaints from tenants will appear here.' : ''}
        />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tenant</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Priority</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    <Link to={`/landlord/complaints/${c.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{c.category}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.creator ? `${c.creator.first_name} ${c.creator.last_name}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${priorityBadge(c.priority)}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statusBadge(c.status)}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
