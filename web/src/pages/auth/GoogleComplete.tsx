import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { getErrorMessage } from '@/lib/utils'
import type { UserRole, TenantPackage } from '@/types/auth'

export function GoogleComplete() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const googleId = searchParams.get('googleId')!
  const email = searchParams.get('email')!
  const first_name = searchParams.get('first_name')!
  const last_name = searchParams.get('last_name')!
  const avatar_url = searchParams.get('avatar_url') ?? undefined

  const [role, setRole] = useState<UserRole>('tenant')
  const [pkg, setPkg] = useState<TenantPackage>('standard')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If missing required params, redirect to register
  if (!googleId || !email || !first_name || !last_name) {
    navigate('/register', { replace: true })
    return null
  }

  const handleComplete = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authService.googleComplete({
        googleId,
        email,
        first_name,
        last_name,
        avatar_url,
        role,
        package: role === 'tenant' ? pkg : undefined,
      })
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
      <h1 className="text-h2 text-foreground mb-1">One last step</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Welcome, {first_name}! Tell us how you'll use AssetHub.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <div className="space-y-5">
        {/* Role selector */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">I am a</label>
          <div className="flex gap-2 p-1 rounded-xl bg-muted">
            {(['tenant', 'landlord'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                  role === r
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                {r === 'tenant' ? '🏠 Tenant' : '🔑 Landlord'}
              </button>
            ))}
          </div>
        </div>

        {/* Package selector — tenants only */}
        {role === 'tenant' && (
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Package</label>
            <div className="flex gap-2 p-1 rounded-xl bg-muted">
              {(['standard', 'student'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPkg(p)}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                    pkg === p
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  {p === 'standard' ? '🏙 Standard' : '🎓 Student'}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleComplete}
          disabled={loading}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Setting up...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
