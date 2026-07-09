import { useAuthStore } from '@/stores/auth.store'

export function useAuth() {
  const store = useAuthStore()
  return {
    user: store.user,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    login: store.setAuth,
    logout: store.clearAuth,
    updateUser: store.updateUser,
  }
}
