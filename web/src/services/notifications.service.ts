import { api } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/api.endpoints'
import type { AppNotification } from '@/types/notification'

export const notificationsService = {
  list: async (): Promise<AppNotification[]> => {
    const res = await api.get(API_ENDPOINTS.notifications.list)
    return Array.isArray(res.data) ? res.data : res.data.data ?? []
  },

  markRead: async (id: string): Promise<void> => {
    await api.put(API_ENDPOINTS.notifications.markRead(id))
  },

  markAllRead: async (): Promise<void> => {
    await api.put(API_ENDPOINTS.notifications.markAllRead)
  },
}
