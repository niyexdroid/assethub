import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Bed, Bath, Home, Shield, Wallet } from 'lucide-react'
import { propertiesService, type Property } from '@/services/properties.service'
import { formatNGN } from '@/lib/utils'
import { ErrorState } from '@/components/custom/ErrorState'

export default function PropertyDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPhoto, setCurrentPhoto] = useState(0)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    propertiesService.getById(id)
      .then(setProperty)
      .catch(() => setError('Could not load property.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-80 bg-muted rounded-xl" />
          <div className="h-6 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </div>
    )
  }

  if (error || !property) return <ErrorState message={error || 'Property not found'} onRetry={() => navigate(0)} />

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 p-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Photo carousel */}
      {property.photos && property.photos.length > 0 ? (
        <div className="relative mx-4 rounded-2xl overflow-hidden bg-muted h-[400px]">
          <img
            src={property.photos[currentPhoto]}
            alt={`${property.title} - ${currentPhoto + 1}`}
            className="w-full h-full object-cover"
          />
          {/* Dots */}
          {property.photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {property.photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPhoto(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i === currentPhoto ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
          {/* Arrows */}
          {property.photos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentPhoto((p) => (p === 0 ? property.photos!.length - 1 : p - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentPhoto((p) => (p === property.photos!.length - 1 ? 0 : p + 1))}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                →
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="mx-4 rounded-2xl bg-muted h-[300px] flex items-center justify-center text-muted-foreground">
          No photos available
        </div>
      )}

      {/* Details */}
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-h2 text-foreground">{property.title}</h1>
              <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="w-4 h-4" /> {property.address}, {property.lga}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-h2 font-extrabold text-primary">{formatNGN(property.rent_amount)}</div>
              <div className="text-xs text-muted-foreground">per year</div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {property.bedrooms != null && (
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
              <Bed className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-semibold">{property.bedrooms}</div>
                <div className="text-xs text-muted-foreground">Bedrooms</div>
              </div>
            </div>
          )}
          {property.bathrooms != null && (
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
              <Bath className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-semibold">{property.bathrooms}</div>
                <div className="text-xs text-muted-foreground">Bathrooms</div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
            <Home className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-semibold capitalize">{property.property_type.replace('_', ' ')}</div>
              <div className="text-xs text-muted-foreground">Type</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-semibold">{property.is_available ? 'Available' : 'Taken'}</div>
              <div className="text-xs text-muted-foreground">Status</div>
            </div>
          </div>
        </div>

        {/* Description */}
        {property.description && (
          <div>
            <h3 className="text-h4 text-foreground mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{property.description}</p>
          </div>
        )}

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div>
            <h3 className="text-h4 text-foreground mb-3">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((a) => (
                <span key={a} className="px-3 py-1.5 rounded-lg bg-muted text-sm text-muted-foreground">{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Fees */}
        {(property.caution_fee || property.agency_fee) && (
          <div>
            <h3 className="text-h4 text-foreground mb-3">Additional Fees</h3>
            <div className="grid grid-cols-2 gap-3">
              {property.caution_fee && (
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-semibold">{formatNGN(property.caution_fee)}</div>
                    <div className="text-xs text-muted-foreground">Caution Fee</div>
                  </div>
                </div>
              )}
              {property.agency_fee && (
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-semibold">{formatNGN(property.agency_fee)}</div>
                    <div className="text-xs text-muted-foreground">Agency Fee</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Apply CTA */}
        {property.is_available && (
          <div className="sticky bottom-0 py-4 bg-gradient-to-t from-background via-background">
            <Link
              to={`/apply/${property.id}`}
              className="flex items-center justify-center w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Apply for this property
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
