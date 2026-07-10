import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, FileText } from 'lucide-react'
import { kycService } from '@/services/kyc.service'
import { ErrorState } from '@/components/custom/ErrorState'

export default function KycReviewScreen() {
  const [status, setStatus] = useState<{ status: string; message?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const s = await kycService.getStatus()
      setStatus(s)
    } catch {
      setError('Could not load KYC status.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-4">
        <div className="h-6 bg-muted rounded w-24 animate-pulse" />
        <div className="h-40 rounded-xl bg-muted animate-pulse" />
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link to="/kyc" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to KYC
      </Link>
      <h1 className="text-h2 text-foreground mb-6">KYC Review</h1>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Verification Status</h3>
            <p className={`text-sm font-medium capitalize ${
              status?.status === 'verified' ? 'text-emerald-600' :
              status?.status === 'pending' ? 'text-amber-600' :
              status?.status === 'rejected' ? 'text-destructive' :
              'text-muted-foreground'
            }`}>
              {status?.status?.replace('_', ' ') ?? 'Not submitted'}
            </p>
          </div>
        </div>

        {status?.message && (
          <div className="p-4 rounded-xl bg-muted">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Details</span>
            </div>
            <p className="text-sm text-muted-foreground">{status.message}</p>
          </div>
        )}

        {!status?.status || status.status === 'rejected' ? (
          <div className="mt-6 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-4">You can retry verification by visiting one of the methods below:</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/kyc/bvn" className="px-4 py-2 rounded-lg bg-muted text-sm font-medium hover:bg-muted/80">BVN</Link>
              <Link to="/kyc/nin" className="px-4 py-2 rounded-lg bg-muted text-sm font-medium hover:bg-muted/80">NIN</Link>
              <Link to="/kyc/student" className="px-4 py-2 rounded-lg bg-muted text-sm font-medium hover:bg-muted/80">Student ID</Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
