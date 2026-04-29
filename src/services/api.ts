import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import { useAuthStore } from '../store/auth.store';

export function getErrorMessage(error: any): string {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ECONNABORTED') return 'Request timed out. Check your connection.';
  if (error?.message === 'Network Error') return 'Could not reach the server. Check your connection.';
  return 'Something went wrong. Please try again.';
}

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — try refresh, then redirect to login
let isRefreshing = false;
let pendingQueue: { resolve: (v: any) => void; reject: (e: any) => void }[] = [];

function processPendingQueue(error: any, token: string | null) {
  pendingQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    console.warn(`[api] ${original?.method?.toUpperCase()} ${original?.url} →`, error.response?.status ?? error.code ?? error.message);

    if (error.response?.status !== 401 || original._retry || original.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then(token => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) {
        await useAuthStore.getState().clearAuth();
        throw new Error('No refresh token');
      }

      const res = await axios.post(
        `${API_BASE_URL}/api/v1${API_ENDPOINTS.auth.refresh}`,
        { refresh_token: refreshToken },
        { timeout: 10000 }
      );

      const { access_token, refresh_token: newRefresh } = res.data;
      await SecureStore.setItemAsync('access_token', access_token);
      if (newRefresh) await SecureStore.setItemAsync('refresh_token', newRefresh);

      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
      processPendingQueue(null, access_token);

      original.headers.Authorization = `Bearer ${access_token}`;
      return api(original);
    } catch (refreshError: any) {
      processPendingQueue(refreshError, null);
      // Only clear auth if the server explicitly rejected the refresh token (401/403).
      // Network errors and timeouts leave the user logged in so a bad connection
      // doesn't silently sign them out.
      const status = refreshError?.response?.status;
      if (status === 401 || status === 403) {
        await useAuthStore.getState().clearAuth();
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
