import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { completeProfileSchema } from '@/lib/validators'
import { getErrorMessage } from '@/lib/utils'
import type { UserRole } from '@/types/auth'

export function CompleteProfile() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const profile_token = searchParams.get('profile_token')
  const email = searchParams.get('email') ?? ''

  const form = useForm<z.infer<typeof completeProfileSchema>>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { first_name: '', last_name: '', role: 'tenant', package_type: 'standard' },
  })
  const role = form.watch('role')

  // No token → the OTP step was skipped; send them back to start.
  if (!profile_token) {
    navigate('/register', { replace: true })
    return null
  }

  const onSubmit = async (data: z.infer<typeof completeProfileSchema>) => {
    setLoading(true)
    setError('')
    try {
      const res = await authService.completeProfile({
        profile_token,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
        package_type: data.role === 'tenant' ? data.package_type : undefined,
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
        {email ? <>Finish setting up <strong>{email}</strong>.</> : 'Tell us a bit about yourself.'}
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Role selector */}
        <div className="flex gap-2 p-1 rounded-xl bg-muted">
          {(['tenant', 'landlord'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => form.setValue('role', r)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                role === r
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              {r === 'tenant' ? 'Tenant' : 'Landlord'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">First name</label>
            <input {...form.register('first_name')} className="w-full h-11 px-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            {form.formState.errors.first_name && <p className="text-xs text-destructive mt-1">{form.formState.errors.first_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Last name</label>
            <input {...form.register('last_name')} className="w-full h-11 px-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            {form.formState.errors.last_name && <p className="text-xs text-destructive mt-1">{form.formState.errors.last_name.message}</p>}
          </div>
        </div>

        {role === 'tenant' && (
          <div className="flex gap-2 p-1 rounded-xl bg-muted">
            {(['standard', 'student'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => form.setValue('package_type', p)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  form.watch('package_type') === p
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                {p === 'standard' ? 'Standard' : 'Student'}
              </button>
            ))}
          </div>
        )}

        <button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? 'Creating account...' : 'Finish'}
        </button>
      </form>
    </div>
  )
}
