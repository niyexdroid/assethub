# Task 7: KYC Pages (5 shared pages)

## Goal

Create 5 shared KYC pages in `web/src/pages/shared/`:
1. `KycOverview.tsx` — dashboard with 3 method cards linking to BVN/NIN/Student
2. `KycBvn.tsx` — BVN form (11 digits), submit via `kycService.submitBvn(bvn)`
3. `KycNin.tsx` — NIN form (11 digits), submit via `kycService.submitNin(nin)`
4. `KycStudent.tsx` — School name + matric number, submit via `kycService.submitStudentId(formData)`
5. `KycReview.tsx` — read-only status display via `kycService.getStatus()`

## KycOverview.tsx

```tsx
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
```

## KycBvn.tsx

```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { kycService } from '@/services/kyc.service'

export default function KycBvnScreen() {
  const [bvn, setBvn] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!/^\d{11}$/.test(bvn)) { setError('Enter a valid 11-digit BVN.'); return }
    setSubmitting(true)
    setError('')
    try {
      await kycService.submitBvn(bvn)
      setSuccess(true)
    } catch (err) {
      setError((err as any)?.response?.data?.message ?? (err as any)?.message ?? 'BVN verification failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link to="/kyc" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to KYC
      </Link>
      <h1 className="text-h2 text-foreground mb-6">BVN Verification</h1>

      {success ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">BVN Submitted</h3>
          <p className="text-sm text-muted-foreground mb-4">Your BVN has been submitted for verification. We'll notify you once it's confirmed.</p>
          <Link to="/kyc" className="text-sm font-medium text-primary hover:underline">Back to KYC</Link>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">BVN (11 digits)</label>
            <input
              type="text" value={bvn} onChange={(e) => setBvn(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="Enter your BVN"
              maxLength={11}
              className="w-full h-11 px-4 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono tracking-widest"
            />
          </div>
          {error && <p className="text-sm text-destructive p-3 rounded-lg bg-destructive/10">{error}</p>}
          <button onClick={handleSubmit} disabled={submitting}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity">
            {submitting ? 'Verifying...' : 'Verify BVN'}
          </button>
        </div>
      )}
    </div>
  )
}
```

## KycNin.tsx

```tsx
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
```

## KycStudent.tsx

```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { kycService } from '@/services/kyc.service'

export default function KycStudentScreen() {
  const [school, setSchool] = useState('')
  const [matricNumber, setMatricNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!school.trim()) { setError('School name is required.'); return }
    if (!matricNumber.trim()) { setError('Matriculation number is required.'); return }
    setSubmitting(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('school', school.trim())
      fd.append('matric_number', matricNumber.trim())
      await kycService.submitStudentId(fd)
      setSuccess(true)
    } catch (err) {
      setError((err as any)?.response?.data?.message ?? (err as any)?.message ?? 'Student verification failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link to="/kyc" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to KYC
      </Link>
      <h1 className="text-h2 text-foreground mb-6">Student Verification</h1>

      {success ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Student ID Submitted</h3>
          <p className="text-sm text-muted-foreground mb-4">Your student information has been submitted for verification.</p>
          <Link to="/kyc" className="text-sm font-medium text-primary hover:underline">Back to KYC</Link>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">School Name</label>
            <input type="text" value={school} onChange={(e) => setSchool(e.target.value)}
              placeholder="e.g. University of Lagos"
              className="w-full h-11 px-4 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Matriculation Number</label>
            <input type="text" value={matricNumber} onChange={(e) => setMatricNumber(e.target.value)}
              placeholder="e.g. 190802001"
              className="w-full h-11 px-4 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {error && <p className="text-sm text-destructive p-3 rounded-lg bg-destructive/10">{error}</p>}
          <button onClick={handleSubmit} disabled={submitting}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity">
            {submitting ? 'Verifying...' : 'Verify Student ID'}
          </button>
        </div>
      )}
    </div>
  )
}
```

## KycReview.tsx

```tsx
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
```

## Verification

1. Run `cd web && npx tsc --noEmit --pretty 2>&1 | head -20` — expect no new errors
2. Commit: `git add web/src/pages/shared/ && git commit -m "feat: add shared KYC pages (Overview, BVN, NIN, Student, Review)"`

Note: Create the `web/src/pages/shared/` directory first if it doesn't exist.

## Global Constraints

- Catch blocks use type assertion
- Icons from `lucide-react` only
