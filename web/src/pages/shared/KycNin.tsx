import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { kycService } from '@/services/kyc.service'

export default function KycNinScreen() {
  const [nin, setNin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!/^\d{11}$/.test(nin)) { setError('Enter a valid 11-digit NIN.'); return }
    setSubmitting(true)
    setError('')
    try {
      await kycService.submitNin(nin)
      setSuccess(true)
    } catch (err) {
      setError((err as any)?.response?.data?.message ?? (err as any)?.message ?? 'NIN verification failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link to="/kyc" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to KYC
      </Link>
      <h1 className="text-h2 text-foreground mb-6">NIN Verification</h1>

      {success ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">NIN Submitted</h3>
          <p className="text-sm text-muted-foreground mb-4">Your NIN has been submitted for verification. We'll notify you once it's confirmed.</p>
          <Link to="/kyc" className="text-sm font-medium text-primary hover:underline">Back to KYC</Link>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">NIN (11 digits)</label>
            <input
              type="text" value={nin} onChange={(e) => setNin(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="Enter your NIN"
              maxLength={11}
              className="w-full h-11 px-4 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono tracking-widest"
            />
          </div>
          {error && <p className="text-sm text-destructive p-3 rounded-lg bg-destructive/10">{error}</p>}
          <button onClick={handleSubmit} disabled={submitting}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity">
            {submitting ? 'Verifying...' : 'Verify NIN'}
          </button>
        </div>
      )}
    </div>
  )
}
