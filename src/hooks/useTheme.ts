import { useThemeStore } from '../store/theme.store';

/**
 * Drop-in hook for every component that needs theme colors.
 *
 * Usage:
 *   const { theme, mode, toggleTheme } = useTheme();
 *   <View style={{ backgroundColor: theme.background }} />
 */
export function useTheme() {
  const { theme, mode, toggleTheme, setMode } = useThemeStore();
  return { theme, mode, toggleTheme, setMode, isDark: mode === 'dark' };
}
