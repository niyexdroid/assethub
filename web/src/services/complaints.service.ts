import { api } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/api.endpoints'
import type { Complaint, ComplaintMessage } from '@/types/complaint'

export const complaintsService = {
  list: async (): Promise<Complaint[]> => {
    const res = await api.get(API_ENDPOINTS.complaints.list)
    return Array.isArray(res.data) ? res.data : res.data.data ?? []
  },

  create: async (data: any): Promise<Complaint> => {
    const res = await api.post(API_ENDPOINTS.complaints.create, data)
    return res.data
  },

  getById: async (id: string): Promise<Complaint> => {
    const res = await api.get(API_ENDPOINTS.complaints.detail(id))
    return res.data
  },

  getMessages: async (complaintId: string): Promise<ComplaintMessage[]> => {
    const res = await api.get(API_ENDPOINTS.complaints.messages(complaintId))
    return Array.isArray(res.data) ? res.data : res.data.data ?? []
  },

  addMessage: async (complaintId: string, message: string): Promise<ComplaintMessage> => {
    const res = await api.post(API_ENDPOINTS.complaints.messages(complaintId), { message })
    return res.data
  },

  escalate: async (id: string): Promise<void> => {
    await api.put(API_ENDPOINTS.complaints.escalate(id))
  },

  resolve: async (id: string): Promise<void> => {
    await api.put(API_ENDPOINTS.complaints.resolve(id))
  },
}
