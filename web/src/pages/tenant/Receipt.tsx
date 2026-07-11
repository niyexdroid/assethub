import { useEffect, useState } from 'react'
import { useLocation, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Printer } from 'lucide-react'
import { paymentsService, type PaymentTransaction } from '@/services/payments.service'
import { formatNGN, formatDate } from '@/lib/utils'
import { ErrorState } from '@/components/custom/ErrorState'

export default function ReceiptScreen() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [tx, setTx] = useState<PaymentTransaction | null>((location.state as any)?.transaction ?? null)
  const [loading, setLoading] = useState(!tx)
  const [error, setError] = useState('')

  useEffect(() => {
    const txId = searchParams.get('id')
    if (tx || !txId) return
    setLoading(true)
    paymentsService.getTransaction(txId)
      .then(setTx)
      .catch(() => setError('Could not load receipt.'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    )
  }

  if (error || !tx) return <ErrorState message={error || 'Receipt not found.'} />

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to="/payments" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to payments
        </Link>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-muted">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      <div className="rounded-2xl border bg-card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-1">Payment {tx.status === 'success' ? 'Successful' : tx.status}</h2>
        <p className="text-3xl font-extrabold text-primary mt-4">{formatNGN(tx.amount)}</p>

        <div className="mt-8 space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Reference</span>
            <span className="font-mono font-medium text-foreground">{tx.reference}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium text-foreground">{formatDate(tx.paid_at ?? tx.created_at)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Status</span>
            <span className={`font-semibold capitalize ${
              tx.status === 'success' ? 'text-emerald-600' : tx.status === 'pending' ? 'text-amber-600' : 'text-destructive'
            }`}>{tx.status}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Channel</span>
            <span className="font-medium text-foreground capitalize">{tx.channel || '—'}</span>
          </div>
          {tx.property?.title && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Property</span>
              <span className="font-medium text-foreground">{tx.property.title}</span>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-8">AssetHub — Payment Receipt</p>
      </div>
    </div>
  )
}
