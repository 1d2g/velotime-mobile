import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import { AuthProvider } from '@/src/context/AuthContext';
import { TimesheetProvider } from '@/src/context/TimesheetContext';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <TimesheetProvider>
          <RootLayoutNav />
        </TimesheetProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { colors, isDark } = useTheme();

  const activeNavTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.bg,
          card: colors.surface,
          text: colors.text,
          border: colors.borderSubtle,
          primary: colors.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.bg,
          card: colors.surface,
          text: colors.text,
          border: colors.borderSubtle,
          primary: colors.primary,
        },
      };

  return (
    <NavThemeProvider value={activeNavTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Session Details',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
          }}
        />
      </Stack>
    </NavThemeProvider>
  );
}
