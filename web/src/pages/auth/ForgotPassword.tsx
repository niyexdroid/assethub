import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authService } from '@/services/auth.service'
import { forgotPasswordSchema } from '@/lib/validators'
import { getErrorMessage } from '@/lib/utils'

export function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    setLoading(true)
    setError('')
    try {
      await authService.forgotPassword(data.email)
      setSent(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📧</span>
        </div>
        <h1 className="text-h2 text-foreground mb-2">Check your email</h1>
        <p className="text-sm text-muted-foreground mb-6">We sent a reset code to <strong>{form.getValues('email')}</strong></p>
        <Link to={`/reset-password?email=${encodeURIComponent(form.getValues('email'))}`} className="inline-block text-primary font-medium hover:underline">Reset password</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-h2 text-foreground mb-1">Forgot password</h1>
      <p className="text-sm text-muted-foreground mb-6">Enter your email and we'll send you a reset code</p>
      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
          <input {...form.register('email')} type="email" className="w-full h-11 px-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="you@example.com" />
          {form.formState.errors.email && <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>}
        </div>
        <button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? 'Sending...' : 'Send reset code'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="text-primary font-medium hover:underline">Back to login</Link>
      </p>
    </div>
  )
}
