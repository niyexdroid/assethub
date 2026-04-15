import { api } from './api';
import { API_ENDPOINTS } from '../constants/api';

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
}

export const notificationsService = {
  list: async (): Promise<AppNotification[]> => {
    const res = await api.get(API_ENDPOINTS.notifications.list);
    return res.data;
  },

  markRead: async (id: string): Promise<void> => {
    await api.put(API_ENDPOINTS.notifications.markRead(id));
  },

  markAllRead: async (): Promise<void> => {
    await api.put(API_ENDPOINTS.notifications.markAllRead);
  },
};
