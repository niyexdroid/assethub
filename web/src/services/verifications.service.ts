import { api } from '@/lib/api'

export interface LandlordVerification {
  id: string
  verification_type: 'utility_bill' | 'land_registry' | 'property_title'
  document_url: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  created_at: string
}

export const verificationsService = {
  list: async (): Promise<LandlordVerification[]> => {
    const { data } = await api.get('/verifications')
    return data
  },

  submit: async (verification_type: string, document_url: string): Promise<LandlordVerification> => {
    const { data } = await api.post('/verifications', { verification_type, document_url })
    return data
  },
}
