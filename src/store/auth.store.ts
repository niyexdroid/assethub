import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User, AuthTokens } from '../types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricsEnabled: boolean;
  requiresBiometric: boolean;

  setAuth:              (user: User, tokens: AuthTokens) => Promise<void>;
  updateUser:           (user: User) => Promise<void>;
  clearAuth:            () => Promise<void>;
  loadAuth:             () => Promise<void>;
  setBiometricsEnabled: (enabled: boolean) => Promise<void>;
  unlockWithBiometric:  () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  biometricsEnabled: false,
  requiresBiometric: false,

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
    const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 4000));
    try {
      const result = await Promise.race([
        Promise.all([
          SecureStore.getItemAsync('access_token'),
          SecureStore.getItemAsync('user'),
          SecureStore.getItemAsync('biometrics_enabled'),
        ]),
        timeout,
      ]);
      if (result) {
        const [token, userJson, bioEnabled] = result;
        const isBioEnabled = bioEnabled === 'true';
        if (token && userJson) {
          if (isBioEnabled) {
            set({ user: JSON.parse(userJson), token, requiresBiometric: true });
          } else {
            set({ user: JSON.parse(userJson), token, isAuthenticated: true });
          }
        }
        set({ biometricsEnabled: isBioEnabled });
      }
    } catch {
      // Ignore — user will be treated as logged out
    } finally {
      set({ isLoading: false });
    }
  },

  setBiometricsEnabled: async (enabled) => {
    await SecureStore.setItemAsync('biometrics_enabled', enabled ? 'true' : 'false');
    set({ biometricsEnabled: enabled });
  },

  unlockWithBiometric: () => {
    set({ isAuthenticated: true, requiresBiometric: false });
  },
}));
