import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { paymentsService } from '@/services/payments.service'
import { formatNGN } from '@/lib/utils'

export default function PayRentScreen() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [tenancyId, setTenancyId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const amt = Number(amount)
    if (!amt || amt <= 0) { setError('Enter a valid amount.'); return }
    if (!tenancyId.trim()) { setError('Tenancy ID is required.'); return }
    setSubmitting(true)
    setError('')
    try {
      const result = await paymentsService.initialize(tenancyId.trim(), amt)
      window.location.href = result.authorization_url
    } catch (err) {
      setError((err as any)?.response?.data?.message ?? (err as any)?.message ?? 'Could not initiate payment.')
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-h2 text-foreground mb-6">Pay Rent</h1>

      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Tenancy ID</label>
          <input
            type="text" value={tenancyId} onChange={(e) => setTenancyId(e.target.value)}
            placeholder="e.g. a1b2c3d4-..."
            className="w-full h-11 px-4 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Amount (₦)</label>
          <input
            type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 500000"
            min="1"
            className="w-full h-11 px-4 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {amount && !isNaN(Number(amount)) && (
            <p className="text-sm text-muted-foreground mt-2">{formatNGN(Number(amount))}</p>
          )}
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <CreditCard className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">You will be redirected to Paystack to complete your payment securely.</p>
        </div>

        {error && <p className="text-sm text-destructive p-3 rounded-lg bg-destructive/10">{error}</p>}

        <button
          onClick={handleSubmit} disabled={submitting}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {submitting ? 'Redirecting...' : 'Pay with Paystack'}
        </button>
      </div>
    </div>
  )
}
