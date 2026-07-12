import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapPin, Bed, Bath, Edit, ArrowLeft, AlertTriangle, Building2, ShieldAlert } from 'lucide-react'
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
  const [deleteError, setDeleteError] = useState('')
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
    setDeleteError('')
    try {
      await propertiesService.update(id, { is_available: false })
      navigate('/landlord/listings')
    } catch (err) {
      setDeleteError((err as any)?.response?.data?.message ?? (err as any)?.message ?? 'Failed to remove listing.')
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
      listing_type: property.listing_type ?? 'standard',
      property_type: property.property_type,
      description: property.description ?? '',
      address: property.address,
      lga: property.lga,
      nearest_landmark: property.nearest_landmark ?? '',
      bedrooms: property.bedrooms != null ? String(property.bedrooms) : '',
      bathrooms: property.bathrooms != null ? String(property.bathrooms) : '',
      tenancy_mode: property.tenancy_mode ?? 'yearly',
      monthly_rent: property.monthly_rent ? String(property.monthly_rent) : '',
      yearly_rent: property.yearly_rent ? String(property.yearly_rent) : '',
      caution_fee: property.caution_fee != null ? String(property.caution_fee) : '',
      agency_fee: property.agency_fee != null ? String(property.agency_fee) : '',
      available_units: property.available_units != null ? String(property.available_units) : '1',
      amenities: property.amenities ?? [],
      gender_preference: property.gender_preference ?? 'any',
      rules: property.rules ?? '',
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
          {formatNGN(property.yearly_rent ?? property.monthly_rent)}<span className="text-base font-normal text-muted-foreground">/year</span>
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
        {property.available_units != null && (
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Available Units</p>
            <p className="text-sm font-semibold">{property.available_units}</p>
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
            {deleteError && (
              <p className="text-sm text-destructive mb-4 p-2 rounded-lg bg-destructive/10">{deleteError}</p>
            )}
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
