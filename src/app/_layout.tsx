import { DarkTheme, DefaultTheme, Redirect, Stack, ThemeProvider as RouterThemeProvider, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SQLite from 'expo-sqlite';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { ThemeProvider, useAppTheme } from '@/contexts/theme-context';

SplashScreen.preventAutoHideAsync();

if (process.env.EXPO_OS === 'web') {
  SQLite.configureWeb({ wasmURL: require('../../assets/wa-sqlite.wasm') });
}

export default function TabLayout() {
  return (
    <ThemeProvider>
      <ThemedNavigation />
    </ThemeProvider>
  );
}

function ThemedNavigation() {
  const { colorScheme } = useAppTheme();

  return (
    <RouterThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AuthNavigation />
      </AuthProvider>
    </RouterThemeProvider>
  );
}

function AuthNavigation() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const firstSegment = segments[0];
  const isProtectedRoute = firstSegment === '(tabs)' || firstSegment === 'crear' || firstSegment === 'mensajes';

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1464a5" />
      </View>
    );
  }

  if (!session && isProtectedRoute) {
    return <Redirect href="/login" />;
  }

  return (
    <>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f8fb',
  },
});
