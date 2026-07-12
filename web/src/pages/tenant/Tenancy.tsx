import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { tenanciesService, type Tenancy as T } from '@/services/tenancies.service'
import { formatNGN, formatDate } from '@/lib/utils'
import { EmptyState } from '@/components/custom/EmptyState'
import { ErrorState } from '@/components/custom/ErrorState'

export default function TenancyScreen() {
  const [tenancies, setTenancies] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await tenanciesService.getTenantTenancies()
      setTenancies(data)
    } catch {
      setError('Could not load tenancies.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const active = tenancies.filter((t) => t.status === 'active')
  const pending = tenancies.filter((t) => t.status === 'pending')
  const past = tenancies.filter((t) => t.status === 'terminated' || t.status === 'declined')

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-h2 text-foreground mb-6">My Tenancy</h1>

      {tenancies.length === 0 ? (
        <EmptyState
          title="No tenancies yet"
          description="When you apply for a property and get approved, your tenancy will appear here."
          action={
            <Link to="/home" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              Browse properties
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Active */}
          {active.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-emerald-500 uppercase mb-3">Active ({active.length})</h3>
              <div className="space-y-3">
                {active.map((t) => (
                  <TenancyCard key={t.id} tenancy={t} />
                ))}
              </div>
            </div>
          )}

          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-amber-500 uppercase mb-3">Pending ({pending.length})</h3>
              <div className="space-y-3">
                {pending.map((t) => (
                  <TenancyCard key={t.id} tenancy={t} />
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Past</h3>
              <div className="space-y-3">
                {past.map((t) => (
                  <TenancyCard key={t.id} tenancy={t} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const statusIcon = (status: string) => {
  switch (status) {
    case 'active': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    case 'pending': return <Clock className="w-5 h-5 text-amber-500" />
    default: return <XCircle className="w-5 h-5 text-muted-foreground" />
  }
}

function TenancyCard({ tenancy }: { tenancy: T }) {
  return (
    <Link
      to={`/tenancy/${tenancy.id}`}
      className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all group"
    >
      <div className="shrink-0">{statusIcon(tenancy.status)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground truncate">{tenancy.property?.title ?? 'Property'}</span>
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          <span className="capitalize">{tenancy.status}</span>
          <span>{formatNGN(tenancy.yearly_amount ?? tenancy.monthly_amount)}/yr</span>
          {tenancy.start_date && <span>Since {formatDate(tenancy.start_date)}</span>}
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
    </Link>
  )
}
