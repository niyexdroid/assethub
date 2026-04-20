import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, Theme } from '../constants/colors';

interface ThemeStore {
  mode:       'dark' | 'light';
  theme:      Theme;
  toggleTheme: () => void;
  setMode:    (mode: 'dark' | 'light') => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode:  'dark',
      theme: darkTheme,

      toggleTheme: () => {
        const next = get().mode === 'dark' ? 'light' : 'dark';
        set({ mode: next, theme: next === 'dark' ? darkTheme : lightTheme });
      },

      setMode: (mode) => {
        set({ mode, theme: mode === 'dark' ? darkTheme : lightTheme });
      },
    }),
    {
      name:    'assethub-theme',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist mode — rehydrate theme object on load
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.theme = state.mode === 'dark' ? darkTheme : lightTheme;
        }
      },
    }
  )
);
