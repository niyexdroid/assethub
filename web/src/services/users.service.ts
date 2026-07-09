import { api } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/api.endpoints'
import type { User } from '@/types/auth'

export const usersService = {
  getMe: async (): Promise<User> => {
    const res = await api.get<User>(API_ENDPOINTS.users.me)
    return res.data
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const res = await api.put<User>(API_ENDPOINTS.users.me, data)
    return res.data
  },

  changePassword: async (data: { current_password: string; new_password: string }): Promise<void> => {
    await api.put(API_ENDPOINTS.users.changePassword, data)
  },

  uploadAvatar: async (file: File): Promise<{ avatar_url: string }> => {
    const form = new FormData()
    form.append('avatar', file)
    const res = await api.put<{ avatar_url: string }>(API_ENDPOINTS.users.avatar, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
}
