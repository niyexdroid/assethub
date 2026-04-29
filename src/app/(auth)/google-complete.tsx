import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';
import { typography } from '../../constants/typography';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';

const ROLES = [{ id: 'tenant', label: '🏠 I am a Tenant' }, { id: 'landlord', label: '🔑 I am a Landlord' }];
const PKGS  = [{ id: 'standard', label: '🏙 Standard' }, { id: 'student', label: '🎓 Student' }];

export default function GoogleCompleteScreen() {
  const { theme } = useTheme();
  const insets    = useSafeAreaInsets();
  const { setAuth } = useAuthStore();
  const params    = useLocalSearchParams<{
    googleId: string; email: string; first_name: string; last_name: string; avatar_url?: string;
  }>();

  const [role, setRole] = useState<'tenant' | 'landlord'>('tenant');
  const [pkg,  setPkg]  = useState<'standard' | 'student'>('standard');
  const [loading, setLoading] = useState(false);

  const onComplete = async () => {
    setLoading(true);
    try {
      const response = await authService.googleComplete({
        googleId:   params.googleId,
        email:      params.email,
        first_name: params.first_name,
        last_name:  params.last_name,
        avatar_url: params.avatar_url,
        role,
        package: role === 'tenant' ? pkg : undefined,
      });
      await setAuth(response.user, response.tokens);
      router.replace(response.user.role === 'landlord' ? '/(landlord)/dashboard' : '/(onboarding)/kyc-bvn');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message ?? 'Could not complete sign-up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>

        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          <LinearGradient colors={theme.primaryGrad} style={styles.logoBox}>
            <Text style={{ fontSize: 28 }}>🏠</Text>
          </LinearGradient>
          <Text style={[typography.h2, { color: theme.textPrimary, marginTop: 20 }]}>One last step</Text>
          <Text style={[typography.body, { color: theme.textSecondary, marginTop: 4, textAlign: 'center' }]}>
            Welcome, {params.first_name}! Tell us how you'll use AssetHub.
          </Text>
        </Animated.View>

        {/* Role */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.section}>
          <Text style={[typography.label, { color: theme.textMuted, marginBottom: 8 }]}>I AM A</Text>
          <View style={styles.toggleRow}>
            {ROLES.map(r => (
              <Pressable key={r.id} onPress={() => setRole(r.id as any)} style={{ flex: 1 }}>
                <View style={[styles.toggleOption, {
                  borderColor:     role === r.id ? theme.primary : theme.border,
                  backgroundColor: role === r.id ? theme.primary + '18' : theme.surface,
                }]}>
                  <Text style={[typography.bodyMed, { color: role === r.id ? theme.primaryLight : theme.textSecondary }]}>
                    {r.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Package — tenants only */}
        {role === 'tenant' && (
          <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.section}>
            <Text style={[typography.label, { color: theme.textMuted, marginBottom: 8 }]}>PACKAGE</Text>
            <View style={styles.toggleRow}>
              {PKGS.map(p => (
                <Pressable key={p.id} onPress={() => setPkg(p.id as any)} style={{ flex: 1 }}>
                  <View style={[styles.toggleOption, {
                    borderColor:     pkg === p.id ? theme.accent : theme.border,
                    backgroundColor: pkg === p.id ? theme.accent + '18' : theme.surface,
                  }]}>
                    <Text style={[typography.bodyMed, { color: pkg === p.id ? theme.accent : theme.textSecondary }]}>
                      {p.label}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <Button title="Continue" onPress={onComplete} size="lg" loading={loading} />
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll:       { flexGrow: 1, padding: 28, paddingTop: 80 },
  header:       { alignItems: 'center', marginBottom: 36 },
  logoBox:      { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  section:      { marginBottom: 20 },
  toggleRow:    { flexDirection: 'row', gap: 10 },
  toggleOption: { padding: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
});
