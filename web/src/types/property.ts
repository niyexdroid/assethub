export interface Property {
  id: string
  title: string
  address: string
  lga: string
  property_type: string
  listing_type?: 'standard' | 'student'
  monthly_rent?: number | string
  yearly_rent?: number | string
  caution_fee?: number
  agency_fee?: number
  bedrooms?: number
  bathrooms?: number
  tenancy_mode?: 'monthly' | 'yearly' | 'both'
  description?: string
  amenities?: string[]
  photos?: string[]
  available_units?: number
  nearest_landmark?: string
  gender_preference?: 'any' | 'male' | 'female'
  rules?: string
  is_available: boolean
  is_approved: boolean
  landlord_id: string
  landlord?: { first_name: string; last_name: string; avatar_url?: string }
  created_at: string
  updated_at: string
}

export interface SearchFilters {
  lga?: string
  property_type?: string
  query?: string
  min_price?: number
  max_price?: number
}
