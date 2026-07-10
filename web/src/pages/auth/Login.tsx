import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton'
import { loginSchema } from '@/lib/validators'
import { getErrorMessage } from '@/lib/utils'

export function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loginToken, setLoginToken] = useState<string | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: searchParams.get('email') ?? '', password: '' },
  })

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setLoading(true)
    setError('')
    try {
      const res = await authService.login(data)
      if ('requiresOtp' in res && res.requiresOtp) {
        setLoginToken(res.login_token)
        return
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // OTP step
  if (loginToken) {
    return (
      <VerifyLoginOtpInline
        loginToken={loginToken}
        onSuccess={(user, token, refreshToken) => {
          setAuth(user, token, refreshToken)
          navigate(user.role === 'landlord' ? '/landlord/dashboard' : '/home')
        }}
      />
    )
  }

  return (
    <div>
      <h1 className="text-h2 text-foreground mb-1">Welcome back</h1>
      <p className="text-sm text-muted-foreground mb-6">Sign in to your AssetHub account</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <div className="mb-5">
        <GoogleSignInButton onError={(msg) => setError(msg)} />
      </div>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">or sign in with email</span></div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
          <input
            {...form.register('email')}
            type="email"
            className="w-full h-11 px-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="you@example.com"
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
          <div className="relative">
            <input
              {...form.register('password')}
              type={showPw ? 'text' : 'password'}
              className="w-full h-11 px-4 pr-11 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary font-medium hover:underline">Create one</Link>
      </p>

      {/* ── Dev quick access ────────────────────────── */}
      <div className="mt-6 pt-5 border-t border-border">
        <p className="text-xs text-muted-foreground text-center mb-3">⚡ Dev quick access</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              const user = { id: 'dev-landlord-1', first_name: 'Alex', last_name: 'Johnson', email: 'landlord@test.com', role: 'landlord' as const, is_verified: true }
              const token = 'dev-token-landlord'
              const refreshToken = 'dev-refresh-landlord'
              // 1. Update in-memory store
              useAuthStore.getState().setAuth(user, token, refreshToken)
              // 2. Write directly to localStorage to guarantee it's there before navigation
              localStorage.setItem('assethub-auth', JSON.stringify({ state: { user, token, refreshToken }, version: 0 }))
              // 3. Navigate — AuthGate will see the store, RequireAuth reads localStorage on mount
              navigate('/landlord/dashboard')
            }}
            className="h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-sm font-medium hover:bg-orange-500/20 transition-colors"
          >
            🏠 Landlord
          </button>
          <button
            type="button"
            onClick={() => {
              const user = { id: 'dev-tenant-1', first_name: 'Sarah', last_name: 'Okafor', email: 'tenant@test.com', role: 'tenant' as const, is_verified: true }
              const token = 'dev-token-tenant'
              const refreshToken = 'dev-refresh-tenant'
              useAuthStore.getState().setAuth(user, token, refreshToken)
              localStorage.setItem('assethub-auth', JSON.stringify({ state: { user, token, refreshToken }, version: 0 }))
              navigate('/home')
            }}
            className="h-10 rounded-xl bg-brand-green/10 border border-brand-green/20 text-brand-green-dark dark:text-brand-green-light text-sm font-medium hover:bg-brand-green/20 transition-colors"
          >
            🔑 Tenant
          </button>
        </div>
      </div>
    </div>
  )
}

// Inline OTP verifier (shown after login succeeds)
function VerifyLoginOtpInline({ loginToken, onSuccess }: { loginToken: string; onSuccess: (user: any, token: string, rt?: string) => void }) {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) return
    setLoading(true)
    setError('')
    try {
      const res = await authService.verifyLoginOtp(loginToken, otp)
      onSuccess(res.user, res.tokens.access_token, res.tokens.refresh_token)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-h2 text-foreground mb-1">Enter OTP</h1>
      <p className="text-sm text-muted-foreground mb-6">A 6-digit code was sent to your email</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <input
          type="text"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          className="w-full h-14 text-center text-2xl tracking-widest rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="000000"
        />
        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>
    </div>
  )
}
