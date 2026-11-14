import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ThemeColors,
  ThemeMode,
  AccentTheme,
  darkTheme,
  getThemedColors,
} from '../constants/theme';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  accent: AccentTheme;
  setAccent: (accent: AccentTheme) => Promise<void>;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'velotime_app_theme_mode';
const ACCENT_STORAGE_KEY = '@velotime_accent_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [accent, setAccentState] = useState<AccentTheme>('rose');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadTheme() {
      try {
        const [savedMode, savedAccent] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(ACCENT_STORAGE_KEY),
        ]);
        if (savedMode === 'dark' || savedMode === 'light' || savedMode === 'system') {
          setModeState(savedMode);
        }
        if (
          savedAccent === 'rose' ||
          savedAccent === 'blue' ||
          savedAccent === 'violet' ||
          savedAccent === 'amber'
        ) {
          setAccentState(savedAccent);
        }
      } catch {}
      setIsLoaded(true);
    }
    loadTheme();
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    await AsyncStorage.setItem(STORAGE_KEY, newMode).catch(() => {});
  };

  const setAccent = async (newAccent: AccentTheme) => {
    setAccentState(newAccent);
    await AsyncStorage.setItem(ACCENT_STORAGE_KEY, newAccent).catch(() => {});
  };

  const isDark =
    mode === 'dark'
      ? true
      : mode === 'light'
      ? false
      : deviceColorScheme === 'dark';

  const colors = getThemedColors(isDark, accent);

  return (
    <ThemeContext.Provider value={{ mode, setMode, accent, setAccent, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      mode: 'dark' as ThemeMode,
      setMode: async () => {},
      accent: 'rose' as AccentTheme,
      setAccent: async () => {},
      colors: darkTheme,
      isDark: true,
    };
  }
  return context;
}
