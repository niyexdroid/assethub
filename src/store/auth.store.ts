import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User, AuthTokens } from '../types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth:    (user: User, tokens: AuthTokens) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  clearAuth:  () => Promise<void>;
  loadAuth:   () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  updateUser: async (user) => {
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ user });
  },

  setAuth: async (user, tokens) => {
    await SecureStore.setItemAsync('access_token', tokens.access_token);
    if (tokens.refresh_token) {
      await SecureStore.setItemAsync('refresh_token', tokens.refresh_token);
    }
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ user, token: tokens.access_token, isAuthenticated: true });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const userJson = await SecureStore.getItemAsync('user');
      if (token && userJson) {
        set({ user: JSON.parse(userJson), token, isAuthenticated: true });
      }
    } catch {
      // corrupt storage — clear it
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('user');
    } finally {
      set({ isLoading: false });
    }
  },
}));
