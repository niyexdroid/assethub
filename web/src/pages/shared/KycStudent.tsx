import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Upload } from 'lucide-react'
import { kycService } from '@/services/kyc.service'

export default function KycStudentScreen() {
  const [schoolName, setSchoolName] = useState('')
  const [schoolEmail, setSchoolEmail] = useState('')
  const [studentIdFile, setStudentIdFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!schoolName.trim()) { setError('School name is required.'); return }
    if (!studentIdFile) { setError('Student ID image is required.'); return }
    setSubmitting(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('school_name', schoolName.trim())
      if (schoolEmail.trim()) fd.append('school_email', schoolEmail.trim())
      fd.append('student_id', studentIdFile)
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
            <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)}
              placeholder="e.g. University of Lagos"
              className="w-full h-11 px-4 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">School Email <span className="font-normal normal-case">(optional)</span></label>
            <input type="email" value={schoolEmail} onChange={(e) => setSchoolEmail(e.target.value)}
              placeholder="e.g. student@unilag.edu.ng"
              className="w-full h-11 px-4 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Student ID Image</label>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full h-20 rounded-xl border-2 border-dashed bg-card flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:border-ring transition-colors">
              <Upload className="w-5 h-5" />
              {studentIdFile ? studentIdFile.name : 'Tap to upload student ID image'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => setStudentIdFile(e.target.files?.[0] ?? null)} />
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
