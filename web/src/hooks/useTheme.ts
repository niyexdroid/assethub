import { useThemeStore } from '@/stores/theme.store'

export function useTheme() {
  const store = useThemeStore()
  return {
    mode: store.mode,
    isDark: store.mode === 'dark',
    toggleTheme: store.toggleTheme,
    setTheme: store.setTheme,
  }
}
