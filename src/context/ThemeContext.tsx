import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, ThemeMode, darkTheme, lightTheme } from '../constants/theme';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'velotime_app_theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'dark' || saved === 'light' || saved === 'system') {
          setModeState(saved);
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

  const isDark =
    mode === 'dark'
      ? true
      : mode === 'light'
      ? false
      : deviceColorScheme === 'dark';

  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, setMode, colors, isDark }}>
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
      colors: darkTheme,
      isDark: true,
    };
  }
  return context;
}
