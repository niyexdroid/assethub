import axios from 'axios'
import { API_ENDPOINTS } from './api.endpoints'

const BASE = import.meta.env.VITE_API_URL ?? 'https://backend-production-aec4.up.railway.app'

export const api = axios.create({
  baseURL: `${BASE}/api/v1`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach Bearer token ──────
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('assethub-auth')
  if (stored) {
    try {
      const { state } = JSON.parse(stored)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    } catch {
      // malformed — ignore
    }
  }
  return config
})

// ── Response interceptor: 401 → refresh → retry ───
let isRefreshing = false
let pendingQueue: { resolve: (v: any) => void; reject: (e: any) => void }[] = []

function processQueue(error: any, token: string | null) {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  pendingQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // Dev token: silently fail API calls, don't redirect to login
    const stored = localStorage.getItem('assethub-auth')
    const token = stored ? JSON.parse(stored).state?.token : null
    if (token?.startsWith('dev-token-')) {
      return Promise.reject(error)
    }

    if (error.response?.status !== 401 || original._retry || original.url?.includes('/auth/')) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const refreshToken = stored ? JSON.parse(stored).state?.refreshToken : null

      if (!refreshToken) {
        localStorage.removeItem('assethub-auth')
        window.location.href = '/login'
        throw new Error('No refresh token')
      }

      const res = await axios.post(
        `${BASE}/api/v1${API_ENDPOINTS.auth.refresh}`,
        { refresh_token: refreshToken },
        { timeout: 10000 },
      )

      const { access_token, refresh_token: newRefresh } = res.data

      // Update stored token
      const authData = stored ? JSON.parse(stored) : { state: {} }
      authData.state.token = access_token
      if (newRefresh) authData.state.refreshToken = newRefresh
      localStorage.setItem('assethub-auth', JSON.stringify(authData))

      processQueue(null, access_token)
      original.headers.Authorization = `Bearer ${access_token}`
      return api(original)
    } catch (refreshError: any) {
      processQueue(refreshError, null)
      const status = refreshError?.response?.status
      if (status === 401 || status === 403) {
        localStorage.removeItem('assethub-auth')
        window.location.href = '/login'
      }
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
