import type { Property } from './property'

export interface Tenancy {
  id: string
  property_id: string
  tenant_id: string
  landlord_id: string
  status: 'pending' | 'active' | 'terminated' | 'declined'
  tenancy_type: 'monthly' | 'yearly'
  start_date?: string
  end_date?: string
  monthly_amount?: number | string
  yearly_amount?: number | string
  caution_fee?: number
  agency_fee?: number
  tenant_signed: boolean
  landlord_signed: boolean
  tenant?: { first_name: string; last_name: string; avatar_url?: string; email: string }
  property?: Property
  created_at: string
}
