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
                    {formatNGN(p.yearly_rent ?? p.monthly_rent)}<span className="text-xs font-normal text-muted-foreground">/yr</span>
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
