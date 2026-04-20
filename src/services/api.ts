import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';

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
      if (!refreshToken) throw new Error('No refresh token');

      const res = await axios.post(
        `${API_BASE_URL}/api/v1${API_ENDPOINTS.auth.refresh}`,
        { refresh_token: refreshToken }
      );

      const { access_token, refresh_token: newRefresh } = res.data;
      await SecureStore.setItemAsync('access_token', access_token);
      if (newRefresh) await SecureStore.setItemAsync('refresh_token', newRefresh);

      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
      processPendingQueue(null, access_token);

      original.headers.Authorization = `Bearer ${access_token}`;
      return api(original);
    } catch (refreshError) {
      processPendingQueue(refreshError, null);
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('user');
      router.replace('/(auth)/login');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
