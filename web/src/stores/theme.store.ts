import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeMode = 'dark' | 'light'

interface ThemeState {
  mode: ThemeMode
  toggleTheme: () => void
  setTheme: (mode: ThemeMode) => void
}

// Apply theme class on load
const storedTheme = localStorage.getItem('assethub-theme')
const initialMode: ThemeMode = storedTheme
  ? JSON.parse(storedTheme).state?.mode ?? 'dark'
  : 'dark'

if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('dark', initialMode === 'dark')
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: initialMode,

      toggleTheme: () => {
        const next = get().mode === 'dark' ? 'light' : 'dark'
        set({ mode: next })
        document.documentElement.classList.toggle('dark', next === 'dark')
      },

      setTheme: (mode) => {
        set({ mode })
        document.documentElement.classList.toggle('dark', mode === 'dark')
      },
    }),
    { name: 'assethub-theme' },
  ),
)
