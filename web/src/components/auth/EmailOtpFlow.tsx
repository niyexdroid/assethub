import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton'
import { loginSchema } from '@/lib/validators'
import { getErrorMessage } from '@/lib/utils'

const COPY = {
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to your AssetHub account',
    action: 'Sign in',
    divider: 'or sign in with email',
    footer: "Don't have an account?",
    footerLink: 'Create one',
    footerTo: '/register',
  },
  register: {
    title: 'Create account',
    subtitle: 'Join AssetHub today',
    action: 'Continue',
    divider: 'or sign up with email',
    footer: 'Already have an account?',
    footerLink: 'Sign in',
    footerTo: '/login',
  },
} as const

export function EmailOtpFlow({ mode }: { mode: 'login' | 'register' }) {
  const copy = COPY[mode]
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [loginToken, setLoginToken] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: searchParams.get('email') ?? '' },
  })

  const requestOtp = async (data: z.infer<typeof loginSchema>) => {
    setLoading(true)
    setError('')
    try {
      const { login_token } = await authService.login(data)
      setEmail(data.email)
      setLoginToken(login_token)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (loginToken) {
    return (
      <OtpStep
        email={email}
        loginToken={loginToken}
        onBack={() => setLoginToken(null)}
      />
    )
  }

  return (
    <div>
      <h1 className="text-h2 text-foreground mb-1">{copy.title}</h1>
      <p className="text-sm text-muted-foreground mb-6">{copy.subtitle}</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <div className="mb-5">
        <GoogleSignInButton
          label={mode === 'register' ? 'Sign up with Google' : undefined}
          onError={(msg) => setError(msg)}
        />
      </div>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">{copy.divider}</span></div>
      </div>

      <form onSubmit={form.handleSubmit(requestOtp)} className="space-y-4">
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

        <p className="text-xs text-muted-foreground">We'll email you a 6-digit code — no password needed.</p>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Sending code...' : copy.action}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {copy.footer}{' '}
        <Link to={copy.footerTo} className="text-primary font-medium hover:underline">{copy.footerLink}</Link>
      </p>

      {mode === 'login' && <DevQuickAccess navigate={navigate} />}
    </div>
  )
}

// ── OTP step ─────────────────────────────────────────
function OtpStep({ email, loginToken, onBack }: { email: string; loginToken: string; onBack: () => void }) {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) return
    setLoading(true)
    setError('')
    try {
      const res = await authService.verifyLoginOtp(loginToken, otp)
      if (res.isNewUser) {
        navigate(`/complete-profile?profile_token=${encodeURIComponent(res.profile_token)}&email=${encodeURIComponent(email)}`)
        return
      }
      setAuth(res.user, res.tokens.access_token, res.tokens.refresh_token)
      navigate(res.user.role === 'landlord' ? '/landlord/dashboard' : '/home')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')
    try {
      await authService.resendLoginOtp(loginToken)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setResending(false)
    }
  }

  return (
    <div>
      <h1 className="text-h2 text-foreground mb-1">Enter code</h1>
      <p className="text-sm text-muted-foreground mb-6">A 6-digit code was sent to <strong>{email}</strong></p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          className="w-full h-14 text-center text-2xl tracking-widest rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="000000"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button type="button" onClick={onBack} className="text-muted-foreground hover:text-foreground">← Change email</button>
        <button type="button" onClick={handleResend} disabled={resending} className="text-primary hover:underline disabled:opacity-50">
          {resending ? 'Sending...' : 'Resend code'}
        </button>
      </div>
    </div>
  )
}

// ── Dev quick access (login only) ────────────────────
function DevQuickAccess({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const quick = (role: 'landlord' | 'tenant') => {
    const user =
      role === 'landlord'
        ? { id: 'dev-landlord-1', first_name: 'Alex', last_name: 'Johnson', email: 'landlord@test.com', role: 'landlord' as const, is_verified: true }
        : { id: 'dev-tenant-1', first_name: 'Sarah', last_name: 'Okafor', email: 'tenant@test.com', role: 'tenant' as const, is_verified: true }
    const token = `dev-token-${role}`
    const refreshToken = `dev-refresh-${role}`
    useAuthStore.getState().setAuth(user, token, refreshToken)
    localStorage.setItem('assethub-auth', JSON.stringify({ state: { user, token, refreshToken }, version: 0 }))
    navigate(role === 'landlord' ? '/landlord/dashboard' : '/home')
  }

  return (
    <div className="mt-6 pt-5 border-t border-border">
      <p className="text-xs text-muted-foreground text-center mb-3">⚡ Dev quick access</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => quick('landlord')}
          className="h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-sm font-medium hover:bg-orange-500/20 transition-colors"
        >
          🏠 Landlord
        </button>
        <button
          type="button"
          onClick={() => quick('tenant')}
          className="h-10 rounded-xl bg-brand-green/10 border border-brand-green/20 text-brand-green-dark dark:text-brand-green-light text-sm font-medium hover:bg-brand-green/20 transition-colors"
        >
          🔑 Tenant
        </button>
      </div>
    </div>
  )
}
