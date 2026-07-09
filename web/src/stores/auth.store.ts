import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/auth'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean

  setAuth: (user: User, token: string, refreshToken?: string) => void
  updateUser: (user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, token, refreshToken) =>
        set({
          user,
          token,
          refreshToken: refreshToken ?? null,
          isAuthenticated: true,
        }),

      updateUser: (user) => set({ user }),

      clearAuth: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'assethub-auth',
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        refreshToken: s.refreshToken,
      }),
      // Use merge instead of onRehydrateStorage — the callback runs inside
      // hydrate() which fires synchronously during create(), so referencing
      // `useAuthStore` hits TDZ ("Cannot access before initialization").
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<Pick<AuthState, 'user' | 'token' | 'refreshToken'>>),
        isAuthenticated: !!((persisted as { token?: unknown })?.token),
      }),
    },
  ),
)
