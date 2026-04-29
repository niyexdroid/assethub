import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/auth.store';

export default function NotFound() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (user?.role === 'landlord') return <Redirect href="/(landlord)/dashboard" />;
  return <Redirect href="/(tenant)/home" />;
}
