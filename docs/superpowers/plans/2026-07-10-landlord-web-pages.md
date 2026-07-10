# Landlord Web Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 5 Placeholder routes with real landlord pages: My Listings, Create/Edit Listing, Listing Detail, Tenancies List, Tenancy Detail.

**Architecture:** 6 new React components + 1 edit to App.tsx. Follows the Dashboard pattern (useState + useCallback + useEffect, Promise.allSettled, Tailwind skeletons, ErrorState, EmptyState). A shared ListingForm component handles both Create and Edit modes.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, React Router v6, lucide-react, axios (via existing api client)

## Global Constraints

- Follow the Dashboard pattern exactly: loading skeletons → ErrorState → EmptyState → data
- Use existing `@/services/*.service` methods (no new API calls)
- Use existing `@/components/custom/{EmptyState,ErrorState}` for empty/error states
- Use existing Tailwind tokens: `bg-card`, `text-muted-foreground`, `border`, `bg-muted`, `text-primary`, etc.
- Use `lucide-react` for all icons
- Match the API field names from `backend/src/modules/properties/properties.validators.ts` (monthly_rent/yearly_rent, not rent_amount)
- Each page handles loading, error, empty, and success states

---

### Task 1: MyListings Page

**Files:**
- Create: `web/src/pages/landlord/MyListings.tsx`

**Interfaces:**
- Consumes: `propertiesService.getLandlordProperties` from `@/services/properties.service`, `Property` type from `@/types/property`, `EmptyState`/`ErrorState` from `@/components/custom/*`, `formatNGN`/`formatNGNCompact` from `@/lib/utils`
- Produces: Default-exported React component wrapping a grid of property cards

- [ ] **Step 1: Create the file**

```tsx
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Building2, MapPin, Bed, Bath, MoreHorizontal } from 'lucide-react'
import { propertiesService, type Property } from '@/services/properties.service'
import { EmptyState } from '@/components/custom/EmptyState'
import { ErrorState } from '@/components/custom/ErrorState'
import { formatNGN } from '@/lib/utils'

export default function MyListings() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await propertiesService.getLandlordProperties()
      setProperties(data)
    } catch {
      setError('Could not load your listings.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="h-8 bg-muted rounded w-48 animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h2 text-foreground">My Listings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'}
          </p>
        </div>
        <Link
          to="/landlord/listings/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Add New Listing
        </Link>
      </div>

      {/* Empty state */}
      {properties.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-12 h-12" />}
          title="No listings yet"
          description="Add your first property listing to start getting tenants."
          action={
            <Link
              to="/landlord/listings/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              <Plus className="w-4 h-4" /> Add Your First Listing
            </Link>
          }
        />
      ) : (
        /* Property cards grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <Link
              key={p.id}
              to={`/landlord/listings/${p.id}`}
              className="group rounded-xl border bg-card hover:shadow-md transition-all overflow-hidden"
            >
              {/* Photo */}
              <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                {p.photos?.[0] ? (
                  <img
                    src={p.photos[0]}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                )}
                {/* Status badges */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {!p.is_available && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-destructive/10 text-destructive">
                      Unavailable
                    </span>
                  )}
                  {p.is_approved === false && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-600">
                      Pending Approval
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-foreground truncate">{p.title}</h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{p.lga}{p.address ? `, ${p.address}` : ''}</span>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  {p.bedrooms != null && (
                    <span className="flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5" /> {p.bedrooms}
                    </span>
                  )}
                  {p.bathrooms != null && (
                    <span className="flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5" /> {p.bathrooms}
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted capitalize">
                    {p.property_type?.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <span className="text-lg font-bold text-foreground">
                    {formatNGN(Number(p.rent_amount) || 0)}<span className="text-xs font-normal text-muted-foreground">/yr</span>
                  </span>
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd web && npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No errors related to MyListings.tsx.

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/landlord/MyListings.tsx
git commit -m "feat: add My Listings page with property card grid"
```

---

### Task 2: ListingForm Shared Component

**Files:**
- Create: `web/src/components/listings/ListingForm.tsx`

**Interfaces:**
- Consumes: `propertiesService.create` / `propertiesService.update` via callbacks passed by parent
- Produces: `ListingForm` component with props: `defaultValues?: PropertyFormData`, `onSubmit: (data: PropertyFormData) => Promise<void>`, `onCancel: () => void`, `submitLabel?: string`, `loading?: boolean`

- [ ] **Step 1: Create the component**

```tsx
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
```

- [ ] **Step 2: Verify it compiles**

```bash
cd web && npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No errors from ListingForm.tsx.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/listings/ListingForm.tsx
git commit -m "feat: add shared ListingForm component for create/edit"
```

---

### Task 3: CreateListing Page

**Files:**
- Create: `web/src/pages/landlord/CreateListing.tsx`

**Interfaces:**
- Consumes: `ListingForm`, `formDataToPayload` from `@/components/listings/ListingForm`, `propertiesService` from `@/services/properties.service`, `useNavigate` from `react-router-dom`
- Produces: Default-exported page component

- [ ] **Step 1: Create the file**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListingForm, formDataToPayload, type PropertyFormData } from '@/components/listings/ListingForm'
import { propertiesService } from '@/services/properties.service'

export default function CreateListing() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: PropertyFormData) => {
    setLoading(true)
    try {
      await propertiesService.create(formDataToPayload(data))
      navigate('/landlord/listings')
    } catch (err) {
      setLoading(false)
      throw err // let ListingForm show the error
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-h2 text-foreground">Create Listing</h1>
        <p className="text-sm text-muted-foreground mt-1">Add a new property to your portfolio.</p>
      </div>
      <ListingForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/landlord/listings')}
        submitLabel="Create Listing"
        loading={loading}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd web && npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No errors from CreateListing.tsx.

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/landlord/CreateListing.tsx
git commit -m "feat: add Create Listing page with form"
```

---

### Task 4: ListingDetail Page

**Files:**
- Create: `web/src/pages/landlord/ListingDetail.tsx`

**Interfaces:**
- Consumes: `propertiesService.getById`, `propertiesService.update` from `@/services/properties.service`, `ListingForm`, `formDataToPayload` from `@/components/listings/ListingForm`, `Property` from `@/types/property`, `useParams`, `useNavigate`, `EmptyState`, `ErrorState`, `formatNGN`, `formatDate`
- Produces: Default-exported page with view mode + edit toggle

- [ ] **Step 1: Create the file**

```tsx
import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, Bed, Bath, Edit, ArrowLeft, AlertTriangle, Building2, Users, ShieldAlert } from 'lucide-react'
import { propertiesService, type Property } from '@/services/properties.service'
import { ListingForm, formDataToPayload, type PropertyFormData } from '@/components/listings/ListingForm'
import { ErrorState } from '@/components/custom/ErrorState'
import { formatNGN, formatDate } from '@/lib/utils'

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const data = await propertiesService.getById(id)
      setProperty(data)
    } catch {
      setError('Could not load property details.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleUpdate = async (data: PropertyFormData) => {
    if (!id) return
    setSaving(true)
    try {
      const updated = await propertiesService.update(id, formDataToPayload(data))
      setProperty(updated)
      setEditing(false)
    } catch (err) {
      setSaving(false)
      throw err
    }
  }

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    try {
      await propertiesService.update(id, { is_available: false })
      navigate('/landlord/listings')
    } catch {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="h-6 bg-muted rounded w-24 animate-pulse" />
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />
  if (!property) return <ErrorState message="Property not found." />

  // ── Edit mode ──────────────────────────────────
  if (editing) {
    const defaults: Partial<PropertyFormData> = {
      title: property.title,
      listing_type: (property as any).listing_type ?? 'standard',
      property_type: property.property_type,
      description: property.description ?? '',
      address: property.address,
      lga: property.lga,
      bedrooms: property.bedrooms != null ? String(property.bedrooms) : '',
      bathrooms: property.bathrooms != null ? String(property.bathrooms) : '',
      monthly_rent: (property as any).monthly_rent ? String((property as any).monthly_rent) : '',
      yearly_rent: property.rent_amount ? String(property.rent_amount) : '',
      caution_fee: property.caution_fee != null ? String(property.caution_fee) : '',
      agency_fee: property.agency_fee != null ? String(property.agency_fee) : '',
      available_units: '1',
      amenities: property.amenities ?? [],
      rules: '',
    }
    return (
      <div className="p-6">
        <div className="mb-6">
          <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to details
          </button>
          <h1 className="text-h2 text-foreground">Edit Listing</h1>
          <p className="text-sm text-muted-foreground mt-1">{property.title}</p>
        </div>
        <ListingForm
          defaultValues={defaults}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          submitLabel="Save Changes"
          loading={saving}
        />
      </div>
    )
  }

  // ── View mode ──────────────────────────────────
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/landlord/listings" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            <Edit className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5"
          >
            <ShieldAlert className="w-4 h-4" /> Remove
          </button>
        </div>
      </div>

      {/* Photo gallery */}
      {property.photos && property.photos.length > 0 ? (
        <div className="rounded-xl border bg-card overflow-hidden mb-6">
          <div className="aspect-[21/9] bg-muted">
            <img src={property.photos[0]} alt={property.title} className="w-full h-full object-cover" />
          </div>
          {property.photos.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {property.photos.slice(1).map((url, i) => (
                <img key={i} src={url} alt="" className="w-20 h-16 rounded-lg object-cover border" />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden mb-6 aspect-[21/9] flex items-center justify-center bg-muted">
          <Building2 className="w-16 h-16 text-muted-foreground/30" />
        </div>
      )}

      {/* Status badges */}
      <div className="flex gap-2 mb-6">
        {property.is_available ? (
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600">Available</span>
        ) : (
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-destructive/10 text-destructive">Unavailable</span>
        )}
        {property.is_approved === false ? (
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-600">Pending Approval</span>
        ) : (
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600">Approved</span>
        )}
      </div>

      {/* Title + price */}
      <div className="mb-8">
        <h1 className="text-h2 text-foreground">{property.title}</h1>
        <div className="flex items-center gap-1 mt-2 text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{property.lga}{property.address ? `, ${property.address}` : ''}</span>
        </div>
        <p className="text-h2 text-foreground mt-4">
          {formatNGN(Number(property.rent_amount) || 0)}<span className="text-base font-normal text-muted-foreground">/year</span>
        </p>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {property.property_type && (
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Type</p>
            <p className="text-sm font-semibold capitalize">{property.property_type.replace(/_/g, ' ')}</p>
          </div>
        )}
        {property.bedrooms != null && (
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Bedrooms</p>
            <p className="text-sm font-semibold flex items-center gap-1"><Bed className="w-4 h-4" /> {property.bedrooms}</p>
          </div>
        )}
        {property.bathrooms != null && (
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Bathrooms</p>
            <p className="text-sm font-semibold flex items-center gap-1"><Bath className="w-4 h-4" /> {property.bathrooms}</p>
          </div>
        )}
        {(property as any).available_units != null && (
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Available Units</p>
            <p className="text-sm font-semibold">{(property as any).available_units}</p>
          </div>
        )}
      </div>

      {/* Fees */}
      {(property.caution_fee || property.agency_fee) && (
        <div className="rounded-xl border bg-card p-5 mb-8">
          <h3 className="text-sm font-semibold text-foreground mb-3">Fees</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {property.caution_fee != null && (
              <div>
                <span className="text-muted-foreground">Caution Fee:</span>{' '}
                <span className="font-medium">{formatNGN(property.caution_fee)}</span>
              </div>
            )}
            {property.agency_fee != null && (
              <div>
                <span className="text-muted-foreground">Agency Fee:</span>{' '}
                <span className="font-medium">{formatNGN(property.agency_fee)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Amenities */}
      {property.amenities && property.amenities.length > 0 && (
        <div className="rounded-xl border bg-card p-5 mb-8">
          <h3 className="text-sm font-semibold text-foreground mb-3">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {property.amenities.map((a) => (
              <span key={a} className="px-3 py-1 rounded-lg bg-muted text-xs font-medium">{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {property.description && (
        <div className="rounded-xl border bg-card p-5 mb-8">
          <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{property.description}</p>
        </div>
      )}

      {/* Meta */}
      <div className="text-xs text-muted-foreground">
        Listed {formatDate(property.created_at)} • Last updated {formatDate(property.updated_at)}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-2xl bg-card border p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Remove Listing</h3>
                <p className="text-xs text-muted-foreground">This marks the property as unavailable.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to remove <strong>{property.title}</strong>? This action can be reversed by editing the listing.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl border text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60"
              >
                {deleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd web && npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No errors from ListingDetail.tsx.

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/landlord/ListingDetail.tsx
git commit -m "feat: add Listing Detail page with view/edit/delete"
```

---

### Task 5: TenanciesList Page

**Files:**
- Create: `web/src/pages/landlord/TenanciesList.tsx`

**Interfaces:**
- Consumes: `tenanciesService.getLandlordTenancies` from `@/services/tenancies.service`, `Tenancy` from `@/types/tenancy`, `EmptyState`, `ErrorState`, `formatNGN`, `formatDate`
- Produces: Default-exported page with filter tabs + table

- [ ] **Step 1: Create the file**

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { tenanciesService, type Tenancy } from '@/services/tenancies.service'
import { EmptyState } from '@/components/custom/EmptyState'
import { ErrorState } from '@/components/custom/ErrorState'
import { formatNGN, formatDate } from '@/lib/utils'

type FilterTab = 'all' | 'active' | 'pending' | 'terminated'

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'terminated', label: 'Terminated' },
]

export default function TenanciesList() {
  const [tenancies, setTenancies] = useState<Tenancy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<FilterTab>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await tenanciesService.getLandlordTenancies()
      setTenancies(data)
    } catch {
      setError('Could not load tenancies.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    if (tab === 'all') return tenancies
    return tenancies.filter((t) => t.status === tab)
  }, [tenancies, tab])

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-emerald-500/10 text-emerald-600',
      pending: 'bg-amber-500/10 text-amber-600',
      terminated: 'bg-muted text-muted-foreground',
      declined: 'bg-destructive/10 text-destructive',
    }
    return map[status] ?? 'bg-muted text-muted-foreground'
  }

  const counts = useMemo(() => {
    const c: Record<FilterTab, number> = { all: tenancies.length, active: 0, pending: 0, terminated: 0 }
    tenancies.forEach((t) => {
      if (t.status === 'active') c.active++
      else if (t.status === 'pending') c.pending++
      else if (t.status === 'terminated' || t.status === 'declined') c.terminated++
    })
    return c
  }, [tenancies])

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="h-8 bg-muted rounded w-48 animate-pulse mb-4" />
        <div className="h-10 bg-muted rounded w-80 animate-pulse mb-6" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-h2 text-foreground">Tenancies</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your tenant relationships.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-muted/50 w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {/* Empty */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title={tab === 'all' ? 'No tenancies yet' : `No ${tab} tenancies`}
          description={tab === 'all' ? 'Tenancies will appear here when tenants accept your offers or applications are approved.' : ''}
        />
      ) : (
        /* Table */
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tenant</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Property</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Rent</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Start Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3">
                    <Link to={`/landlord/tenancies/${t.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                      {t.tenant?.first_name} {t.tenant?.last_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.property?.title ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{t.tenancy_type}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statusBadge(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatNGN(t.rent_amount)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {t.start_date ? formatDate(t.start_date) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd web && npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No errors from TenanciesList.tsx.

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/landlord/TenanciesList.tsx
git commit -m "feat: add Tenancies List page with filter tabs"
```

---

### Task 6: TenancyDetail Page

**Files:**
- Create: `web/src/pages/landlord/TenancyDetail.tsx`

**Interfaces:**
- Consumes: `tenanciesService.getById`, `tenanciesService.terminate` from `@/services/tenancies.service`, `Tenancy` from `@/types/tenancy`, `useParams`, `EmptyState`, `ErrorState`, `formatNGN`, `formatDate`
- Produces: Default-exported detail page with tenant info, property info, signatures, actions

- [ ] **Step 1: Create the file**

```tsx
import { useCallback, useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Building2, Calendar, CreditCard, FileCheck, ShieldAlert, AlertTriangle } from 'lucide-react'
import { tenanciesService, type Tenancy } from '@/services/tenancies.service'
import { ErrorState } from '@/components/custom/ErrorState'
import { formatNGN, formatDate } from '@/lib/utils'

export default function TenancyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tenancy, setTenancy] = useState<Tenancy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [terminating, setTerminating] = useState(false)
  const [showTerminate, setShowTerminate] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const data = await tenanciesService.getById(id)
      setTenancy(data)
    } catch {
      setError('Could not load tenancy details.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleTerminate = async () => {
    if (!id) return
    setTerminating(true)
    try {
      await tenanciesService.terminate(id)
      navigate('/landlord/tenancies')
    } catch {
      setTerminating(false)
      setShowTerminate(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="h-6 bg-muted rounded w-24 animate-pulse" />
        <div className="h-40 rounded-xl bg-muted animate-pulse" />
        <div className="h-40 rounded-xl bg-muted animate-pulse" />
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />
  if (!tenancy) return <ErrorState message="Tenancy not found." />

  const statusColor: Record<string, string> = {
    active: 'text-emerald-600 bg-emerald-500/10',
    pending: 'text-amber-600 bg-amber-500/10',
    terminated: 'text-muted-foreground bg-muted',
    declined: 'text-destructive bg-destructive/10',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/landlord/tenancies" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to tenancies
          </Link>
          <h1 className="text-h2 text-foreground">Tenancy Details</h1>
        </div>
        {tenancy.status === 'active' && (
          <button
            onClick={() => setShowTerminate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5"
          >
            <ShieldAlert className="w-4 h-4" /> Terminate
          </button>
        )}
      </div>

      {/* Status badge */}
      <div className="mb-6">
        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold capitalize ${statusColor[tenancy.status] ?? 'bg-muted text-muted-foreground'}`}>
          {tenancy.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Tenant card */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Tenant</h3>
          </div>
          {tenancy.tenant ? (
            <div>
              <p className="font-semibold text-foreground">{tenancy.tenant.first_name} {tenancy.tenant.last_name}</p>
              <p className="text-sm text-muted-foreground">{tenancy.tenant.email}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tenant assigned</p>
          )}
        </div>

        {/* Property card */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Property</h3>
          </div>
          {tenancy.property ? (
            <div>
              <Link to={`/landlord/listings/${tenancy.property_id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                {tenancy.property.title}
              </Link>
              <p className="text-sm text-muted-foreground">{tenancy.property.address}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {/* Rent & dates card */}
      <div className="rounded-xl border bg-card p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Rent & Dates</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Rent Amount</p>
            <p className="font-semibold">{formatNGN(tenancy.rent_amount)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-semibold capitalize">{tenancy.tenancy_type}</p>
          </div>
          {tenancy.caution_fee != null && (
            <div>
              <p className="text-muted-foreground">Caution Fee</p>
              <p className="font-semibold">{formatNGN(tenancy.caution_fee)}</p>
            </div>
          )}
          {tenancy.agency_fee != null && (
            <div>
              <p className="text-muted-foreground">Agency Fee</p>
              <p className="font-semibold">{formatNGN(tenancy.agency_fee)}</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t text-sm">
          <div>
            <p className="text-muted-foreground">Start Date</p>
            <p className="font-semibold">{tenancy.start_date ? formatDate(tenancy.start_date) : '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">End Date</p>
            <p className="font-semibold">{tenancy.end_date ? formatDate(tenancy.end_date) : '—'}</p>
          </div>
        </div>
      </div>

      {/* Signatures card */}
      <div className="rounded-xl border bg-card p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FileCheck className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Agreement</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${tenancy.tenant_signed ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
            <span>Tenant {tenancy.tenant_signed ? 'signed ✓' : 'not signed'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${tenancy.landlord_signed ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
            <span>Landlord {tenancy.landlord_signed ? 'signed ✓' : 'not signed'}</span>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="text-xs text-muted-foreground">
        Created {formatDate(tenancy.created_at)}
      </div>

      {/* Terminate modal */}
      {showTerminate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-2xl bg-card border p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Terminate Tenancy</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to terminate this tenancy? The tenant will be notified.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowTerminate(false)}
                className="px-4 py-2 rounded-xl border text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleTerminate}
                disabled={terminating}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60"
              >
                {terminating ? 'Terminating...' : 'Terminate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd web && npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No errors from TenancyDetail.tsx.

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/landlord/TenancyDetail.tsx
git commit -m "feat: add Tenancy Detail page with info cards and terminate action"
```

---

### Task 7: Wire Up App.tsx

**Files:**
- Modify: `web/src/App.tsx`

**Interfaces:**
- Consumes: All 5 new page components + ListingForm (imported transitively)
- Produces: Updated route tree replacing Placeholder components with real pages

- [ ] **Step 1: Add imports**

Add these imports after the existing `DashboardScreen` import (line 29):

```tsx
import MyListings from '@/pages/landlord/MyListings'
import CreateListing from '@/pages/landlord/CreateListing'
import ListingDetail from '@/pages/landlord/ListingDetail'
import TenanciesList from '@/pages/landlord/TenanciesList'
import TenancyDetail from '@/pages/landlord/TenancyDetail'
```

- [ ] **Step 2: Replace 5 Placeholder routes**

Replace lines 87-91:
```tsx
<Route path="/landlord/listings" element={<Placeholder title="My Listings" />} />
<Route path="/landlord/listings/create" element={<Placeholder title="Create Listing" />} />
<Route path="/landlord/listings/:id" element={<Placeholder title="Listing Detail" />} />
<Route path="/landlord/tenancies" element={<Placeholder title="Tenancies" />} />
<Route path="/landlord/tenancies/:id" element={<Placeholder title="Tenancy Detail" />} />
```

With:
```tsx
<Route path="/landlord/listings" element={<MyListings />} />
<Route path="/landlord/listings/create" element={<CreateListing />} />
<Route path="/landlord/listings/:id" element={<ListingDetail />} />
<Route path="/landlord/tenancies" element={<TenanciesList />} />
<Route path="/landlord/tenancies/:id" element={<TenancyDetail />} />
```

- [ ] **Step 3: Verify full app compiles**

```bash
cd web && npx tsc --noEmit --pretty 2>&1 | head -30
```

Expected: Zero TypeScript errors.

- [ ] **Step 4: Start dev server and spot-check**

```bash
cd web && npx vite --port 6500 &
```

Navigate to:
- `/landlord/listings` — should show empty state (or property cards if data)
- `/landlord/listings/create` — should show the form
- `/landlord/tenancies` — should show empty state (or table)
- Click a property → `/landlord/listings/:id` — should show detail

- [ ] **Step 5: Commit**

```bash
git add web/src/App.tsx
git commit -m "feat: wire up landlord listings and tenancies pages in router"
```
