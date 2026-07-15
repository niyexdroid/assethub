import { useCallback, useEffect, useMemo, useState } from 'react'
import { CreditCard } from 'lucide-react'
import { paymentsService, type PaymentTransaction } from '@/services/payments.service'
import { EmptyState } from '@/components/custom/EmptyState'
import { ErrorState } from '@/components/custom/ErrorState'
import { formatNGN, formatDate } from '@/lib/utils'

type FilterTab = 'all' | 'success' | 'pending' | 'failed'

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'success', label: 'Successful' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed', label: 'Failed' },
]

export default function Payments() {
  const [payments, setPayments] = useState<PaymentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<FilterTab>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await paymentsService.getHistory()
      setPayments(data)
    } catch {
      setError('Could not load payments.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    if (tab === 'all') return payments
    return payments.filter((p) => p.status === tab)
  }, [payments, tab])

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      success: 'bg-emerald-500/10 text-emerald-600',
      pending: 'bg-amber-500/10 text-amber-600',
      failed: 'bg-destructive/10 text-destructive',
    }
    return map[status] ?? 'bg-muted text-muted-foreground'
  }

  const counts = useMemo(() => {
    const c: Record<FilterTab, number> = { all: payments.length, success: 0, pending: 0, failed: 0 }
    payments.forEach((p) => {
      if (p.status === 'success') c.success++
      else if (p.status === 'pending') c.pending++
      else if (p.status === 'failed') c.failed++
    })
    return c
  }, [payments])

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
        <h1 className="text-h2 text-foreground">Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">Track all incoming payments from tenants.</p>
      </div>

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

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-12 h-12" />}
          title={tab === 'all' ? 'No payments yet' : `No ${tab} payments`}
          description={tab === 'all' ? 'Payments from tenants will appear here.' : ''}
        />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tenant</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Property</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Channel</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {p.tenant ? `${p.tenant.first_name} ${p.tenant.last_name}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.property?.title ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatNGN(p.amount)}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{p.channel ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{formatDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
