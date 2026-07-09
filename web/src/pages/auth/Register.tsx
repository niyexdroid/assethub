import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { registerSchema } from '@/lib/validators'
import { getErrorMessage } from '@/lib/utils'

export function Register() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPw, setShowPw] = useState(false)
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { first_name: '', last_name: '', email: '', password: '', role: 'tenant' },
  })

  const role = form.watch('role')

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    setLoading(true)
    setError('')
    try {
      const res = await authService.register(data)
      setSuccess(res.email)
      navigate(`/verify-email?email=${encodeURIComponent(res.email)}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📧</span>
        </div>
        <h1 className="text-h2 text-foreground mb-2">Check your email</h1>
        <p className="text-sm text-muted-foreground">We sent a verification code to <strong>{success}</strong></p>
        <Link to={`/verify-email?email=${encodeURIComponent(success)}`} className="inline-block mt-6 text-primary font-medium hover:underline">Enter code</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-h2 text-foreground mb-1">Create account</h1>
      <p className="text-sm text-muted-foreground mb-6">Join AssetHub today</p>

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

        {/* Name fields */}
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

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
          <input {...form.register('email')} type="email" className="w-full h-11 px-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="you@example.com" />
          {form.formState.errors.email && <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
          <div className="relative">
            <input {...form.register('password')} type={showPw ? 'text' : 'password'} className="w-full h-11 px-4 pr-11 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Min. 6 characters" />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.formState.errors.password && <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>}
        </div>

        <button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
