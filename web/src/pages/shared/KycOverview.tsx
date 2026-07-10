import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, CreditCard, IdCard, GraduationCap, ChevronRight } from 'lucide-react'
import { kycService } from '@/services/kyc.service'
import { ErrorState } from '@/components/custom/ErrorState'

export default function KycOverviewScreen() {
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

  const methods = [
    { to: '/kyc/bvn', icon: CreditCard, label: 'BVN Verification', desc: 'Bank Verification Number' },
    { to: '/kyc/nin', icon: IdCard, label: 'NIN Verification', desc: 'National Identification Number' },
    { to: '/kyc/student', icon: GraduationCap, label: 'Student Verification', desc: 'Student ID verification' },
  ]

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-h2 text-foreground mb-2">Identity Verification</h1>
      <p className="text-sm text-muted-foreground mb-6">Verify your identity to unlock full platform features.</p>

      <div className="rounded-xl border bg-card p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Overall Status</p>
            <p className="font-semibold text-foreground capitalize">{status?.status?.replace('_', ' ') ?? 'Unknown'}</p>
          </div>
        </div>
        {status?.message && (
          <p className="text-sm text-muted-foreground mt-3 p-3 rounded-lg bg-muted">{status.message}</p>
        )}
      </div>

      <div className="space-y-3">
        {methods.map((m) => (
          <Link key={m.to} to={m.to}
            className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <m.icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-sm">{m.label}</h3>
              <p className="text-xs text-muted-foreground">{m.desc}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
