import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { getErrorMessage } from '@/lib/utils'

export function VerifyEmail() {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const { setAuth } = useAuthStore()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || otp.length !== 6) return
    setLoading(true)
    setError('')
    try {
      const res = await authService.verifyEmail(email, otp)
      setAuth(res.user, res.tokens.access_token, res.tokens.refresh_token)
      navigate(res.user.role === 'landlord' ? '/landlord/dashboard' : '/home')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-h2 text-foreground mb-1">Verify your email</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {email ? <>Enter the 6-digit code sent to <strong>{email}</strong></> : 'Enter the 6-digit code from your email'}
      </p>

      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <form onSubmit={handleVerify} className="space-y-4">
        <input
          type="text" maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          className="w-full h-14 text-center text-2xl tracking-widest rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="000000"
        />
        <button type="submit" disabled={loading || otp.length !== 6} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="text-primary font-medium hover:underline">Back to login</Link>
      </p>
    </div>
  )
}
