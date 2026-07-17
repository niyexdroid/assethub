import { api } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/api.endpoints'

export const kycService = {
  submitBvn: async (bvn: string): Promise<void> => {
    await api.post(API_ENDPOINTS.kyc.bvn, { bvn })
  },

  submitNin: async (nin: string): Promise<void> => {
    await api.post(API_ENDPOINTS.kyc.nin, { nin })
  },

  submitStudentId: async (data: FormData): Promise<void> => {
    await api.post(API_ENDPOINTS.kyc.student, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getStatus: async (): Promise<{ verification_status: string; message?: string }> => {
    const res = await api.get(API_ENDPOINTS.kyc.status)
    return res.data
  },
}
