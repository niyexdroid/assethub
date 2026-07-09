import { useAuthStore } from '@/stores/auth.store'

export function useAuth() {
  const store = useAuthStore()
  return {
    user: store.user,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    login: store.setAuth,
    logout: store.clearAuth,
    updateUser: store.updateUser,
  }
}
