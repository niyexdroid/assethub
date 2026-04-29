import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../store/auth.store';

export default function Index() {
  const { isAuthenticated, isLoading, requiresBiometric, user } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    if (requiresBiometric) {
      router.replace('/(auth)/biometric-lock');
    } else if (isAuthenticated) {
      router.replace(user?.role === 'landlord' ? '/(landlord)/dashboard' : '/(tenant)/home');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, requiresBiometric]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0D1117', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#12A376" />
    </View>
  );
}
