# Task 1: Apply Page

## Goal

Create the tenant Apply page at `web/src/pages/tenant/Apply.tsx` — a form for applying to a rental property.

## What to Build

A React component that:
1. Fetches a property by ID from the URL params (`useParams<{ propertyId: string }>()`)
2. Shows a property summary card (title, address, rent amounts)
3. Has a tenancy type toggle (yearly/monthly) with contextual help text
4. Has a move-in date input (text, YYYY-MM-DD format)
5. Has an optional message textarea
6. Shows an info banner about the review process
7. Submits via `tenanciesService.apply(data)` then navigates to `/tenancy`
8. Has a Cancel button that navigates back

## Exact Code

```tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Info } from 'lucide-react'
import { tenanciesService } from '@/services/tenancies.service'
import { propertiesService, type Property } from '@/services/properties.service'
import { formatNGN } from '@/lib/utils'
import { ErrorState } from '@/components/custom/ErrorState'

export default function ApplyScreen() {
  const { propertyId } = useParams<{ propertyId: string }>()
  const navigate = useNavigate()
  const [property, setProperty] = useState<Property | null>(null)
  const [loadingProp, setLoadingProp] = useState(true)
  const [propError, setPropError] = useState('')
  const [tenancyType, setTenancyType] = useState<'yearly' | 'monthly'>('yearly')
  const [moveInDate, setMoveInDate] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!propertyId) return
    setLoadingProp(true)
    propertiesService.getById(propertyId)
      .then(setProperty)
      .catch(() => setPropError('Could not load property details.'))
      .finally(() => setLoadingProp(false))
  }, [propertyId])

  const handleSubmit = async () => {
    if (!moveInDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setSubmitError('Enter move-in date in YYYY-MM-DD format.')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      await tenanciesService.apply({
        property_id: propertyId,
        tenancy_type: tenancyType,
        move_in_date: moveInDate,
        message: message.trim() || undefined,
      })
      alert('Application sent! The landlord will review it and you\'ll be notified once a decision is made.')
      navigate('/tenancy')
    } catch (err) {
      setSubmitError((err as any)?.response?.data?.message ?? (err as any)?.message ?? 'Could not submit application.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingProp) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <div className="h-6 bg-muted rounded w-24 animate-pulse" />
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    )
  }

  if (propError) return <ErrorState message={propError} onRetry={() => navigate(0)} />

  const p = property!

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-h2 text-foreground mb-6">Apply for Property</h1>

      {/* Property summary */}
      <div className="rounded-xl border bg-card p-5 mb-6">
        <h2 className="font-semibold text-foreground">{p.title}</h2>
        <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
          <MapPin className="w-3.5 h-3.5" /> {p.address}
        </p>
        <div className="flex gap-8 mt-3 text-sm">
          {p.yearly_rent != null && (
            <div>
              <p className="text-muted-foreground">Yearly</p>
              <p className="font-semibold text-primary">{formatNGN(Number(p.yearly_rent))}</p>
            </div>
          )}
          {p.monthly_rent != null && (
            <div>
              <p className="text-muted-foreground">Monthly</p>
              <p className="font-semibold text-primary">{formatNGN(Number(p.monthly_rent))}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tenancy type */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Rent Payment Type</p>
        <div className="flex gap-3">
          {(['yearly', 'monthly'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTenancyType(t)}
              className={`px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors capitalize ${
                tenancyType === t
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {tenancyType === 'yearly'
            ? 'Yearly payment is common in Lagos — usually required upfront.'
            : 'Monthly payment if the landlord accepts it.'}
        </p>
      </div>

      {/* Move-in date */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Preferred Move-in Date</label>
        <input
          type="text"
          value={moveInDate}
          onChange={(e) => setMoveInDate(e.target.value)}
          placeholder="YYYY-MM-DD  e.g. 2026-08-01"
          className="w-full h-11 px-4 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Message */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">
          Message to Landlord <span className="font-normal normal-case">(optional)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Introduce yourself — occupation, number of occupants, references..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 mb-8">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-primary/80">
          The landlord will review your application and contact you. You'll get a notification once a decision is made.
        </p>
      </div>

      {/* Error */}
      {submitError && (
        <p className="text-sm text-destructive mb-4 p-3 rounded-lg bg-destructive/10">{submitError}</p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
        <button
          onClick={() => navigate(-1)}
          className="w-full h-12 rounded-xl border text-sm font-medium hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
```

## Verification

After creating the file:
1. Run `cd web && npx tsc --noEmit --pretty 2>&1 | head -20` — expect no new errors
2. Commit with message: `feat: add tenant Apply page with property summary and form`

## Global Constraints

- Catch blocks use type assertion: `(err as any)?.response?.data?.message ?? (err as any)?.message ?? 'fallback'`
- No form validation library — plain inline checks
- Icons from `lucide-react` only
- Uses `formatNGN` from `@/lib/utils`
