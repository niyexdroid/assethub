import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { getErrorMessage } from '@/lib/utils'

export function VerifyLoginOtp() {
  const [otp, setOtp] = useState('')
  const [loginToken] = useState(() => sessionStorage.getItem('login_token') ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginToken || otp.length !== 6) return
    setLoading(true)
    setError('')
    try {
      const res = await authService.verifyLoginOtp(loginToken, otp)
      setAuth(res.user, res.tokens.access_token, res.tokens.refresh_token)
      sessionStorage.removeItem('login_token')
      navigate(res.user.role === 'landlord' ? '/landlord/dashboard' : '/home')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-h2 text-foreground mb-1">Verify OTP</h1>
      <p className="text-sm text-muted-foreground mb-6">Enter the 6-digit code sent to your email</p>
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
    </div>
  )
}
