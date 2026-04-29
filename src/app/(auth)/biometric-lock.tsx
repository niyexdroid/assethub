import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/auth.store';
import { typography } from '../../constants/typography';

export default function BiometricLockScreen() {
  const { theme }                              = useTheme();
  const { user, unlockWithBiometric, clearAuth } = useAuthStore();
  const [error, setError]                      = useState('');
  const [checking, setChecking]                = useState(false);

  const authenticate = async () => {
    setChecking(true);
    setError('');
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage:    'Verify your identity',
        fallbackLabel:    'Use PIN',
        cancelLabel:      'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        unlockWithBiometric();
        router.replace(user?.role === 'landlord' ? '/(landlord)/dashboard' : '/(tenant)/home');
      } else if (result.error !== 'user_cancel' && result.error !== 'system_cancel') {
        setError('Authentication failed. Try again.');
      }
    } catch {
      setError('Biometric authentication unavailable.');
    } finally {
      setChecking(false);
    }
  };

  // Auto-prompt on mount
  useEffect(() => { authenticate(); }, []);

  const usePassword = async () => {
    await clearAuth();
    router.replace('/(auth)/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.content}>

        <LinearGradient colors={theme.primaryGrad} style={styles.iconBox}>
          <Ionicons name="finger-print" size={48} color="#fff" />
        </LinearGradient>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.textBlock}>
          <Text style={[typography.h2, { color: theme.textPrimary, textAlign: 'center' }]}>
            Welcome back
          </Text>
          <Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center', marginTop: 8 }]}>
            {user?.first_name ? `${user.first_name}, verify` : 'Verify'} your identity to continue
          </Text>
        </Animated.View>

        {error ? (
          <Animated.View entering={FadeInDown.springify()}>
            <Text style={[typography.caption, { color: theme.danger, textAlign: 'center', marginTop: 8 }]}>
              {error}
            </Text>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.actions}>
          <Pressable
            onPress={authenticate}
            disabled={checking}
            style={({ pressed }) => [styles.bioBtn, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="finger-print" size={32} color={checking ? theme.textMuted : theme.primary} />
            <Text style={[typography.bodyMed, { color: checking ? theme.textMuted : theme.primaryLight, marginTop: 8 }]}>
              {checking ? 'Verifying…' : 'Tap to authenticate'}
            </Text>
          </Pressable>

          <Pressable onPress={usePassword} style={styles.passwordBtn}>
            <Text style={[typography.bodyMed, { color: theme.textMuted }]}>Use password instead</Text>
          </Pressable>
        </Animated.View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  content:    { alignItems: 'center', width: '100%', gap: 32 },
  iconBox:    { width: 100, height: 100, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  textBlock:  { alignItems: 'center' },
  actions:    { width: '100%', alignItems: 'center', gap: 20 },
  bioBtn:     { width: '100%', alignItems: 'center', paddingVertical: 28, borderRadius: 20, borderWidth: 1.5 },
  passwordBtn: { paddingVertical: 8 },
});
