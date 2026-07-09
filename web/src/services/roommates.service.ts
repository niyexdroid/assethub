import { api } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/api.endpoints'
import type { RoommateProfile, RoommateMatch, RoommateRequest } from '@/types/roommate'

export const roommatesService = {
  getProfile: async (): Promise<RoommateProfile | null> => {
    const res = await api.get(API_ENDPOINTS.roommates.profile)
    return res.data
  },

  upsertProfile: async (data: any): Promise<RoommateProfile> => {
    const res = await api.put(API_ENDPOINTS.roommates.profile, data)
    return res.data
  },

  getMatches: async (propertyId: string): Promise<RoommateMatch[]> => {
    const res = await api.get(API_ENDPOINTS.roommates.matches(propertyId))
    return Array.isArray(res.data) ? res.data : res.data.data ?? []
  },

  sendRequest: async (receiverId: string): Promise<void> => {
    await api.post(API_ENDPOINTS.roommates.request, { receiver_id: receiverId })
  },

  acceptRequest: async (id: string): Promise<void> => {
    await api.put(API_ENDPOINTS.roommates.acceptRequest(id))
  },

  declineRequest: async (id: string): Promise<void> => {
    await api.put(API_ENDPOINTS.roommates.declineRequest(id))
  },

  getReceivedRequests: async (): Promise<RoommateRequest[]> => {
    const res = await api.get(API_ENDPOINTS.roommates.receivedRequests)
    return Array.isArray(res.data) ? res.data : res.data.data ?? []
  },

  getSentRequests: async (): Promise<RoommateRequest[]> => {
    const res = await api.get(API_ENDPOINTS.roommates.sentRequests)
    return Array.isArray(res.data) ? res.data : res.data.data ?? []
  },
}
