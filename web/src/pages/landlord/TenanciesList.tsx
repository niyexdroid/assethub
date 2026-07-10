import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { tenanciesService, type Tenancy } from '@/services/tenancies.service'
import { EmptyState } from '@/components/custom/EmptyState'
import { ErrorState } from '@/components/custom/ErrorState'
import { formatNGN, formatDate } from '@/lib/utils'

type FilterTab = 'all' | 'active' | 'pending' | 'terminated'

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'terminated', label: 'Terminated' },
]

export default function TenanciesList() {
  const [tenancies, setTenancies] = useState<Tenancy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<FilterTab>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await tenanciesService.getLandlordTenancies()
      setTenancies(data)
    } catch {
      setError('Could not load tenancies.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    if (tab === 'all') return tenancies
    return tenancies.filter((t) => t.status === tab)
  }, [tenancies, tab])

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-emerald-500/10 text-emerald-600',
      pending: 'bg-amber-500/10 text-amber-600',
      terminated: 'bg-muted text-muted-foreground',
      declined: 'bg-destructive/10 text-destructive',
    }
    return map[status] ?? 'bg-muted text-muted-foreground'
  }

  const counts = useMemo(() => {
    const c: Record<FilterTab, number> = { all: tenancies.length, active: 0, pending: 0, terminated: 0 }
    tenancies.forEach((t) => {
      if (t.status === 'active') c.active++
      else if (t.status === 'pending') c.pending++
      else if (t.status === 'terminated' || t.status === 'declined') c.terminated++
    })
    return c
  }, [tenancies])

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="h-8 bg-muted rounded w-48 animate-pulse mb-4" />
        <div className="h-10 bg-muted rounded w-80 animate-pulse mb-6" />
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
        <h1 className="text-h2 text-foreground">Tenancies</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your tenant relationships.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-muted/50 w-fit">
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

      {/* Empty */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title={tab === 'all' ? 'No tenancies yet' : `No ${tab} tenancies`}
          description={tab === 'all' ? 'Tenancies will appear here when tenants accept your offers or applications are approved.' : ''}
        />
      ) : (
        /* Table */
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tenant</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Property</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Rent</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Start Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3">
                    <Link to={`/landlord/tenancies/${t.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                      {t.tenant?.first_name} {t.tenant?.last_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.property?.title ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{t.tenancy_type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statusBadge(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatNGN(t.rent_amount)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {t.start_date ? formatDate(t.start_date) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
