import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { useThemeStore } from '../store/theme.store';
import { useAuthStore } from '../store/auth.store';
import { usePushNotifications } from '../hooks/usePushNotifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { mode, theme } = useThemeStore();
  const { isAuthenticated, isLoading, user, loadAuth } = useAuthStore();
  usePushNotifications();

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Load persisted auth on startup
  useEffect(() => {
    loadAuth();
  }, []);

  useEffect(() => {
    if (!fontsLoaded || isLoading) return;
    SplashScreen.hideAsync();

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else if (user?.role === 'landlord') {
      router.replace('/(landlord)/dashboard');
    } else {
      router.replace('/(tenant)/home');
    }
  }, [fontsLoaded, isLoading, isAuthenticated, user]);

  if (!fontsLoaded || isLoading) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaProvider>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)"       />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(landlord)"   />
        <Stack.Screen name="(tenant)"     />
        <Stack.Screen name="(shared)"     />
      </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
