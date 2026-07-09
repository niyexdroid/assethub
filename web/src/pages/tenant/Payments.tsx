import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { paymentsService, type PaymentTransaction } from '@/services/payments.service'
import { formatNGN, formatDate } from '@/lib/utils'
import { EmptyState } from '@/components/custom/EmptyState'
import { ErrorState } from '@/components/custom/ErrorState'

export default function PaymentsScreen() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await paymentsService.getHistory()
      setTransactions(data)
    } catch {
      setError('Could not load payments.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Summary
  const totalPaid = transactions
    .filter((t) => t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0)

  const pendingPayments = transactions.filter((t) => t.status === 'pending')
  const completedPayments = transactions.filter((t) => t.status === 'success')

  const statusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="flex items-center gap-1 text-xs font-medium text-emerald-500"><CheckCircle2 className="w-3 h-3" /> Paid</span>
      case 'pending':
        return <span className="flex items-center gap-1 text-xs font-medium text-amber-500"><Clock className="w-3 h-3" /> Pending</span>
      default:
        return <span className="flex items-center gap-1 text-xs font-medium text-destructive"><AlertTriangle className="w-3 h-3" /> Failed</span>
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="h-24 rounded-xl bg-muted animate-pulse" />
        <div className="h-16 rounded-xl bg-muted animate-pulse" />
        <div className="h-16 rounded-xl bg-muted animate-pulse" />
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-h2 text-foreground mb-6">Payments</h1>

      {/* Summary banner */}
      <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-brand-green to-brand-green-light text-white">
        <p className="text-sm opacity-80">Total Paid</p>
        <p className="text-h1 mt-1">{formatNGN(totalPaid)}</p>
        <p className="text-xs opacity-60 mt-1">{completedPayments.length} successful transactions</p>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          title="No payments yet"
          description="Your payment history will appear here once you start paying rent."
          icon={<CreditCard className="w-12 h-12 text-muted-foreground" />}
        />
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <Link
              key={tx.id}
              to={`/payments/receipt`}
              state={{ transaction: tx }}
              className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all group"
            >
              <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                <CreditCard className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground text-sm">{formatNGN(tx.amount)}</span>
                  {statusBadge(tx.status)}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span>{tx.property?.title ?? `Ref: ${tx.reference?.slice(0, 12)}...`}</span>
                  <span>{formatDate(tx.paid_at ?? tx.created_at)}</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
