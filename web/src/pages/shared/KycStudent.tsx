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
