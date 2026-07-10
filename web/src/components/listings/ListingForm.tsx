import { useState } from 'react'
import { X, Plus, Save } from 'lucide-react'

/* ── Types ─────────────────────────────────────── */
export interface PropertyFormData {
  title: string
  listing_type: 'standard' | 'student'
  property_type: string
  description: string
  address: string
  lga: string
  nearest_landmark: string
  bedrooms: string
  bathrooms: string
  tenancy_mode: 'monthly' | 'yearly' | 'both'
  monthly_rent: string
  yearly_rent: string
  caution_fee: string
  agency_fee: string
  available_units: string
  amenities: string[]
  gender_preference: 'any' | 'male' | 'female'
  rules: string
}

const PROPERTY_TYPES = [
  'apartment', 'flat', 'duplex', 'self_contain',
  'room', 'hostel', 'bedspace', 'bungalow', 'house',
]

const LGAS = [
  'Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa',
  'Badagry', 'Epe', 'Eti-Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye',
  'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland',
  'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere',
]

function emptyForm(): PropertyFormData {
  return {
    title: '',
    listing_type: 'standard',
    property_type: 'apartment',
    description: '',
    address: '',
    lga: 'Ikeja',
    nearest_landmark: '',
    bedrooms: '',
    bathrooms: '',
    tenancy_mode: 'yearly',
    monthly_rent: '',
    yearly_rent: '',
    caution_fee: '',
    agency_fee: '',
    available_units: '1',
    amenities: [],
    gender_preference: 'any',
    rules: '',
  }
}

interface Props {
  defaultValues?: Partial<PropertyFormData>
  onSubmit: (data: PropertyFormData) => Promise<void>
  onCancel: () => void
  submitLabel?: string
  loading?: boolean
}

export function ListingForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Create Listing',
  loading = false,
}: Props) {
  const [form, setForm] = useState<PropertyFormData>({ ...emptyForm(), ...defaultValues })
  const [amenityInput, setAmenityInput] = useState('')
  const [error, setError] = useState('')

  const set = (key: keyof PropertyFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const addAmenity = () => {
    const a = amenityInput.trim()
    if (a && !form.amenities.includes(a)) {
      setForm((f) => ({ ...f, amenities: [...f.amenities, a] }))
      setAmenityInput('')
    }
  }

  const removeAmenity = (a: string) => {
    setForm((f) => ({ ...f, amenities: f.amenities.filter((x) => x !== a) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.title.trim() || form.title.trim().length < 5) {
      setError('Title must be at least 5 characters.')
      return
    }
    if (!form.address.trim() || form.address.trim().length < 5) {
      setError('Address must be at least 5 characters.')
      return
    }

    const needsMonthly = form.tenancy_mode === 'monthly' || form.tenancy_mode === 'both'
    const needsYearly = form.tenancy_mode === 'yearly' || form.tenancy_mode === 'both'

    if (needsMonthly && (!form.monthly_rent || Number(form.monthly_rent) <= 0)) {
      setError('Monthly rent is required for the selected tenancy mode.')
      return
    }
    if (needsYearly && (!form.yearly_rent || Number(form.yearly_rent) <= 0)) {
      setError('Yearly rent is required for the selected tenancy mode.')
      return
    }

    if (form.bedrooms && Number(form.bedrooms) < 0) {
      setError('Bedrooms cannot be negative.')
      return
    }
    if (form.bathrooms && Number(form.bathrooms) < 0) {
      setError('Bathrooms cannot be negative.')
      return
    }
    if (form.caution_fee && Number(form.caution_fee) < 0) {
      setError('Caution fee cannot be negative.')
      return
    }
    if (form.agency_fee && Number(form.agency_fee) < 0) {
      setError('Agency fee cannot be negative.')
      return
    }

    try {
      await onSubmit(form)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Something went wrong.')
    }
  }

  const inputClass = 'w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors'
  const labelClass = 'block text-sm font-medium text-foreground mb-1.5'
  const selectClass = inputClass + ' appearance-none cursor-pointer'

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Section 1: Basic Info ───────────────── */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h3 className="text-h4 text-foreground">Basic Information</h3>

        <div>
          <label className={labelClass}>Title *</label>
          <input className={inputClass} placeholder="e.g. Modern 2-Bedroom Flat in Ikeja" value={form.title} onChange={set('title')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Listing Type</label>
            <select className={selectClass} value={form.listing_type} onChange={set('listing_type')}>
              <option value="standard">Standard</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Property Type *</label>
            <select className={selectClass} value={form.property_type} onChange={set('property_type')}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea className={inputClass + ' min-h-[100px] resize-y'} placeholder="Describe the property..." value={form.description} onChange={set('description')} />
        </div>
      </section>

      {/* ── Section 2: Location ──────────────────── */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h3 className="text-h4 text-foreground">Location</h3>

        <div>
          <label className={labelClass}>Address *</label>
          <input className={inputClass} placeholder="Street address" value={form.address} onChange={set('address')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>LGA</label>
            <select className={selectClass} value={form.lga} onChange={set('lga')}>
              {LGAS.map((lga) => (
                <option key={lga} value={lga}>{lga}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Nearest Landmark</label>
            <input className={inputClass} placeholder="e.g. Ikeja City Mall" value={form.nearest_landmark} onChange={set('nearest_landmark')} />
          </div>
        </div>
      </section>

      {/* ── Section 3: Pricing ───────────────────── */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h3 className="text-h4 text-foreground">Pricing</h3>

        <div>
          <label className={labelClass}>Tenancy Mode</label>
          <select className={selectClass} value={form.tenancy_mode} onChange={set('tenancy_mode')}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="both">Both</option>
          </select>
        </div>

        {(form.tenancy_mode === 'yearly' || form.tenancy_mode === 'both') && (
          <div>
            <label className={labelClass}>Yearly Rent (₦) *</label>
            <input className={inputClass} type="number" min="0" placeholder="e.g. 1200000" value={form.yearly_rent} onChange={set('yearly_rent')} />
          </div>
        )}

        {(form.tenancy_mode === 'monthly' || form.tenancy_mode === 'both') && (
          <div>
            <label className={labelClass}>Monthly Rent (₦) *</label>
            <input className={inputClass} type="number" min="0" placeholder="e.g. 150000" value={form.monthly_rent} onChange={set('monthly_rent')} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Caution Fee (₦)</label>
            <input className={inputClass} type="number" min="0" placeholder="0" value={form.caution_fee} onChange={set('caution_fee')} />
          </div>
          <div>
            <label className={labelClass}>Agency Fee (₦)</label>
            <input className={inputClass} type="number" min="0" placeholder="0" value={form.agency_fee} onChange={set('agency_fee')} />
          </div>
        </div>
      </section>

      {/* ── Section 4: Details ───────────────────── */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h3 className="text-h4 text-foreground">Property Details</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Bedrooms</label>
            <input className={inputClass} type="number" min="0" placeholder="0" value={form.bedrooms} onChange={set('bedrooms')} />
          </div>
          <div>
            <label className={labelClass}>Bathrooms</label>
            <input className={inputClass} type="number" min="0" placeholder="0" value={form.bathrooms} onChange={set('bathrooms')} />
          </div>
          <div>
            <label className={labelClass}>Available Units</label>
            <input className={inputClass} type="number" min="1" value={form.available_units} onChange={set('available_units')} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Gender Preference</label>
            <select className={selectClass} value={form.gender_preference} onChange={set('gender_preference')}>
              <option value="any">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className={labelClass}>Amenities</label>
          <div className="flex gap-2">
            <input
              className={inputClass + ' flex-1'}
              placeholder="e.g. Water, Electricity, Parking"
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAmenity() } }}
            />
            <button
              type="button"
              onClick={addAmenity}
              className="px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {form.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {form.amenities.map((a) => (
                <span key={a} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                  {a}
                  <button type="button" onClick={() => removeAmenity(a)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>House Rules</label>
          <textarea className={inputClass + ' min-h-[80px] resize-y'} placeholder="Any rules tenants should know..." value={form.rules} onChange={set('rules')} />
        </div>
      </section>

      {/* ── Actions ──────────────────────────────── */}
      <div className="flex items-center gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border text-sm font-medium hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

/**
 * Convert PropertyFormData to the shape the API expects
 */
export function formDataToPayload(f: PropertyFormData) {
  return {
    title: f.title.trim(),
    listing_type: f.listing_type,
    property_type: f.property_type,
    description: f.description.trim() || undefined,
    address: f.address.trim(),
    lga: f.lga,
    nearest_landmark: f.nearest_landmark.trim() || undefined,
    bedrooms: f.bedrooms ? Number(f.bedrooms) : undefined,
    bathrooms: f.bathrooms ? Number(f.bathrooms) : undefined,
    tenancy_mode: f.tenancy_mode,
    monthly_rent: f.monthly_rent ? Number(f.monthly_rent) : undefined,
    yearly_rent: f.yearly_rent ? Number(f.yearly_rent) : undefined,
    caution_fee: f.caution_fee ? Number(f.caution_fee) : 0,
    agency_fee: f.agency_fee ? Number(f.agency_fee) : 0,
    available_units: Number(f.available_units) || 1,
    amenities: f.amenities,
    gender_preference: f.gender_preference,
    rules: f.rules.trim() || undefined,
  }
}
