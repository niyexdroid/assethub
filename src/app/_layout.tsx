import { useEffect } from 'react';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';
import { Stack, router, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useThemeStore } from '../store/theme.store';
import { useAuthStore } from '../store/auth.store';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { OfflineBanner } from '../components/ui/OfflineBanner';

// Hide splash after 3 s no matter what — belt-and-suspenders
SplashScreen.preventAutoHideAsync().catch(() => {});
setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 3000);

function AuthGate() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const segments        = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace(user?.role === 'landlord' ? '/(landlord)/dashboard' : '/(tenant)/home');
    }
  }, [isAuthenticated, isLoading, navigationState?.key]);

  return null;
}

export default function RootLayout() {
  const { mode, theme } = useThemeStore();
  const { loadAuth }    = useAuthStore();
  usePushNotifications();
  useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold });

  useEffect(() => {
    loadAuth();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaProvider>
        <OfflineBanner />
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <AuthGate />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)"       />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(landlord)"   />
          <Stack.Screen name="(tenant)"     />
          <Stack.Screen name="(shared)"     />
          <Stack.Screen name="+not-found"   />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
