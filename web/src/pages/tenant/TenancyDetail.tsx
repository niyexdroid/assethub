import { useCallback, useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, CreditCard, Calendar, User, ShieldAlert, AlertTriangle } from 'lucide-react'
import { tenanciesService, type Tenancy } from '@/services/tenancies.service'
import { paymentsService, type PaymentTransaction } from '@/services/payments.service'
import { ErrorState } from '@/components/custom/ErrorState'
import { EmptyState } from '@/components/custom/EmptyState'
import { formatNGN, formatDate } from '@/lib/utils'

export default function TenancyDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tenancy, setTenancy] = useState<Tenancy | null>(null)
  const [payments, setPayments] = useState<PaymentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [terminating, setTerminating] = useState(false)
  const [terminateError, setTerminateError] = useState('')
  const [showTerminate, setShowTerminate] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [t, p] = await Promise.all([
        tenanciesService.getById(id),
        paymentsService.getHistory(),
      ])
      setTenancy(t)
      setPayments((p as PaymentTransaction[]).filter((tx) => tx.tenancy_id === id))
    } catch {
      setError('Could not load tenancy details.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleTerminate = async () => {
    if (!id) return
    setTerminating(true)
    setTerminateError('')
    try {
      await tenanciesService.terminate(id)
      navigate('/tenancy')
    } catch (err) {
      setTerminateError((err as any)?.response?.data?.message ?? (err as any)?.message ?? 'Failed to terminate tenancy.')
      setTerminating(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="h-6 bg-muted rounded w-24 animate-pulse" />
        <div className="h-40 rounded-xl bg-muted animate-pulse" />
        <div className="h-40 rounded-xl bg-muted animate-pulse" />
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />
  if (!tenancy) return <ErrorState message="Tenancy not found." />

  const statusColor: Record<string, string> = {
    active: 'text-emerald-600 bg-emerald-500/10',
    pending: 'text-amber-600 bg-amber-500/10',
    terminated: 'text-muted-foreground bg-muted',
    declined: 'text-destructive bg-destructive/10',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/tenancy" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to tenancy
          </Link>
          <h1 className="text-h2 text-foreground">Tenancy Details</h1>
        </div>
        {tenancy.status === 'active' && (
          <button
            onClick={() => setShowTerminate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5"
          >
            <ShieldAlert className="w-4 h-4" /> Terminate
          </button>
        )}
      </div>

      {/* Status badge */}
      <div className="mb-6">
        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold capitalize ${statusColor[tenancy.status] ?? 'bg-muted text-muted-foreground'}`}>
          {tenancy.status}
        </span>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Property card */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Property</h3>
          </div>
          {tenancy.property ? (
            <div>
              <p className="font-semibold text-foreground">{tenancy.property.title}</p>
              <p className="text-sm text-muted-foreground">{tenancy.property.address}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>

        {/* Landlord card - Note: tenant object on tenancy has the tenant info, landlord is the landlord_id.
            For tenant view, we show landlord info if available, otherwise show placeholder.
            The tenancy type has tenant object, but landlord contact comes from property owner */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Landlord</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Contact your landlord through the property listing or use the complaints system for urgent issues.
          </p>
        </div>
      </div>

      {/* Rent & dates */}
      <div className="rounded-xl border bg-card p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Rent & Dates</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Rent Amount</p>
            <p className="font-semibold">{formatNGN(tenancy.rent_amount)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-semibold capitalize">{tenancy.tenancy_type}</p>
          </div>
          {tenancy.caution_fee != null && (
            <div>
              <p className="text-muted-foreground">Caution Fee</p>
              <p className="font-semibold">{formatNGN(tenancy.caution_fee)}</p>
            </div>
          )}
          {tenancy.agency_fee != null && (
            <div>
              <p className="text-muted-foreground">Agency Fee</p>
              <p className="font-semibold">{formatNGN(tenancy.agency_fee)}</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t text-sm">
          <div>
            <p className="text-muted-foreground">Start Date</p>
            <p className="font-semibold">{tenancy.start_date ? formatDate(tenancy.start_date) : '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">End Date</p>
            <p className="font-semibold">{tenancy.end_date ? formatDate(tenancy.end_date) : '—'}</p>
          </div>
        </div>
      </div>

      {/* Agreement status */}
      <div className="rounded-xl border bg-card p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Agreement</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${tenancy.tenant_signed ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
            <span>Tenant {tenancy.tenant_signed ? 'signed ✓' : 'not signed'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${tenancy.landlord_signed ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
            <span>Landlord {tenancy.landlord_signed ? 'signed ✓' : 'not signed'}</span>
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="rounded-xl border bg-card p-5 mb-8">
        <h3 className="text-sm font-semibold text-foreground mb-4">Payment History</h3>
        {payments.length === 0 ? (
          <EmptyState title="No payments recorded" description="Payments made for this tenancy will appear here." />
        ) : (
          <div className="space-y-2">
            {payments.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                <div>
                  <p className="font-medium text-foreground">{formatNGN(tx.amount)}</p>
                  <p className="text-muted-foreground text-xs">{tx.reference?.slice(0, 16)}... • {formatDate(tx.paid_at ?? tx.created_at)}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                  tx.status === 'success' ? 'text-emerald-600 bg-emerald-500/10' :
                  tx.status === 'pending' ? 'text-amber-600 bg-amber-500/10' :
                  'text-destructive bg-destructive/10'
                }`}>{tx.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Created */}
      <div className="text-xs text-muted-foreground">
        Created {formatDate(tenancy.created_at)}
      </div>

      {/* Terminate modal */}
      {showTerminate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-2xl bg-card border p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Terminate Tenancy</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to terminate this tenancy? The landlord will be notified.
            </p>
            {terminateError && (
              <p className="text-sm text-destructive mb-4 p-2 rounded-lg bg-destructive/10">{terminateError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowTerminate(false)} className="px-4 py-2 rounded-xl border text-sm font-medium hover:bg-muted">
                Cancel
              </button>
              <button onClick={handleTerminate} disabled={terminating}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60">
                {terminating ? 'Terminating...' : 'Terminate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
