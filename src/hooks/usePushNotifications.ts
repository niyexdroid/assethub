import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/api';
import { useAuthStore } from '../store/auth.store';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge:  true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // Not available in Expo Go or environments without native notifications
}

export function usePushNotifications() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;

        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') return;

        // Use device push token (works in dev builds without Expo push service)
        const tokenData = await Notifications.getDevicePushTokenAsync();
        const fcmToken  = tokenData.data;

        if (fcmToken) {
          await api.post(API_ENDPOINTS.users.fcmToken, { token: fcmToken });
        }
      } catch {
        // Non-critical — silently skip if notifications unavailable
      }

      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('default', {
            name:             'default',
            importance:       Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor:       '#12A376',
          });
        } catch {
          // Silently skip
        }
      }
    })();
  }, [isAuthenticated]);
}
