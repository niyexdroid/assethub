import { api } from './api';
import { API_ENDPOINTS } from '../constants/api';
import { User } from '../types/auth';
import * as FileSystem from 'expo-file-system';

export const usersService = {
  getMe: async (): Promise<User> => {
    const res = await api.get<User>(API_ENDPOINTS.users.me);
    return res.data;
  },

  updateProfile: async (data: { first_name?: string; last_name?: string; email?: string }): Promise<User> => {
    const res = await api.patch<User>(API_ENDPOINTS.users.me, data);
    return res.data;
  },

  changePassword: async (data: { current_password: string; new_password: string }): Promise<void> => {
    await api.post(API_ENDPOINTS.users.changePassword, data);
  },

  uploadAvatar: async (imageUri: string): Promise<{ avatar_url: string; user: User }> => {
    const form = new FormData();
    const filename = imageUri.split('/').pop() ?? 'avatar.jpg';
    const match    = /\.(\w+)$/.exec(filename);
    const type     = match ? `image/${match[1]}` : 'image/jpeg';
    form.append('avatar', { uri: imageUri, name: filename, type } as any);
    const res = await api.post<{ avatar_url: string; user: User }>(
      `${API_ENDPOINTS.users.me}/avatar`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return res.data;
  },
};
