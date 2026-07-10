import { api } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/api.endpoints'
import type { PaymentScheduleItem, PaymentTransaction } from '@/types/payment'

export type { PaymentTransaction, PaymentScheduleItem }

export const paymentsService = {
  initialize: async (tenancyId: string, amount: number): Promise<{ authorization_url: string; reference: string }> => {
    const res = await api.post(API_ENDPOINTS.payments.initialize, { tenancy_id: tenancyId, amount })
    return res.data
  },

  verify: async (reference: string): Promise<any> => {
    const res = await api.get(API_ENDPOINTS.payments.verify(reference))
    return res.data
  },

  getSchedule: async (tenancyId: string): Promise<PaymentScheduleItem[]> => {
    const res = await api.get(API_ENDPOINTS.payments.schedule(tenancyId))
    return Array.isArray(res.data) ? res.data : res.data.data ?? []
  },

  getHistory: async (): Promise<PaymentTransaction[]> => {
    const res = await api.get(API_ENDPOINTS.payments.history)
    return Array.isArray(res.data) ? res.data : res.data.data ?? []
  },

  getTransaction: async (id: string): Promise<PaymentTransaction> => {
    const res = await api.get(API_ENDPOINTS.payments.transaction(id))
    return res.data
  },
}
