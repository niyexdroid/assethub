import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { propertiesService, type Property } from '@/services/properties.service'
import { LAGOS_LGAS } from '@/constants/lgas'
import { useAuthStore } from '@/stores/auth.store'
import { formatNGN } from '@/lib/utils'
import { EmptyState } from '@/components/custom/EmptyState'
import { ErrorState } from '@/components/custom/ErrorState'

const TYPES = ['All', 'Apartment', 'Self Contain', 'Room', 'Hostel', 'Bedspace']

export default function HomeScreen() {
  const { user } = useAuthStore()
  const [query, setQuery] = useState('')
  const [lga, setLga] = useState('All')
  const [type, setType] = useState('All')
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const filters: Record<string, any> = {}
      if (lga !== 'All') filters.lga = lga
      if (type !== 'All') filters.property_type = type.toLowerCase().replace(' ', '_')
      if (query.trim()) filters.query = query.trim()

      const result = await propertiesService.search(filters)
      const data = Array.isArray(result) ? result : result.data ?? []
      setProperties(data as Property[])
    } catch {
      setError('Could not load properties.')
    } finally {
      setLoading(false)
    }
  }, [lga, type, query])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-h2 text-foreground">
          {user?.first_name ? `${greeting()}, ${user.first_name}` : greeting()}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Find your perfect home in Lagos</p>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Search area, property name..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 h-11 px-4 rounded-xl border text-sm font-medium transition-colors ${
            showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 rounded-xl border bg-card space-y-4">
          {/* LGA chips */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Location (LGA)</p>
            <div className="flex flex-wrap gap-2">
              {['All', ...LAGOS_LGAS].map((item) => (
                <button
                  key={item}
                  onClick={() => setLga(item)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    lga === item
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Property type chips */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Property Type</p>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((item) => (
                <button
                  key={item}
                  onClick={() => setType(item)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    type === item
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card overflow-hidden animate-pulse">
              <div className="h-48 bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-5 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : properties.length === 0 ? (
        <EmptyState
          title="No properties found"
          description="Try adjusting your filters or search query"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((p) => (
            <Link
              key={p.id}
              to={`/property/${p.id}`}
              className="group rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              {/* Photo */}
              <div className="h-48 bg-muted relative overflow-hidden">
                {p.photos?.[0] ? (
                  <img src={p.photos[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No photo available
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 rounded-md bg-black/60 text-white text-xs font-medium">{p.lga}</span>
                </div>
                {!p.is_available && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 rounded-md bg-destructive/90 text-white text-xs font-medium">Taken</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {p.title}
                  </h3>
                  <span className="shrink-0 text-lg font-extrabold text-primary">
                    {formatNGN(p.yearly_rent ?? p.monthly_rent)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{p.address}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  {p.bedrooms != null && <span>{p.bedrooms} beds</span>}
                  {p.bathrooms != null && <span>{p.bathrooms} baths</span>}
                  <span className="capitalize">{p.property_type.replace('_', ' ')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
