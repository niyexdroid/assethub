import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { resetPasswordSchema } from '@/lib/validators'
import { getErrorMessage } from '@/lib/utils'

export function ResetPassword() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email, otp: '', new_password: '' },
  })

  const onSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
    setLoading(true)
    setError('')
    try {
      await authService.resetPassword(data)
      setDone(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✅</span>
        </div>
        <h1 className="text-h2 text-foreground mb-2">Password reset</h1>
        <p className="text-sm text-muted-foreground mb-6">Your password has been updated successfully.</p>
        <button onClick={() => navigate('/login')} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">Sign in</button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-h2 text-foreground mb-1">Reset password</h1>
      <p className="text-sm text-muted-foreground mb-6">Enter the OTP and your new password</p>
      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">OTP Code</label>
          <input {...form.register('otp')} maxLength={6} className="w-full h-11 px-4 rounded-xl border bg-background text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-ring" placeholder="000000" />
          {form.formState.errors.otp && <p className="text-xs text-destructive mt-1">{form.formState.errors.otp.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">New password</label>
          <div className="relative">
            <input {...form.register('new_password')} type={showPw ? 'text' : 'password'} className="w-full h-11 px-4 pr-11 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Min. 6 characters" />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.formState.errors.new_password && <p className="text-xs text-destructive mt-1">{form.formState.errors.new_password.message}</p>}
        </div>
        <button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="text-primary font-medium hover:underline">Back to login</Link>
      </p>
    </div>
  )
}
