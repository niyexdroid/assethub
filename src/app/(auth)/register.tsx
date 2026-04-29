import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';
import { GoogleButton } from '../../components/ui/GoogleButton';
import { Input }  from '../../components/ui/Input';
import { typography } from '../../constants/typography';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { RegisterRequest } from '../../types/auth';

GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID });

const ROLES = [{ id: 'tenant', label: '🏠 I am a Tenant' }, { id: 'landlord', label: '🔑 I am a Landlord' }];
const PKGS  = [{ id: 'standard', label: '🏙 Standard' }, { id: 'student', label: '🎓 Student' }];

export default function RegisterScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { setAuth: _setAuth } = useAuthStore();
  const [role, setRole]        = useState<'tenant' | 'landlord'>('tenant');
  const [pkg,  setPkg]         = useState<'standard' | 'student'>('standard');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterRequest>();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const { data } = await GoogleSignin.signIn();
      const idToken = data?.idToken;
      if (!idToken) throw new Error('No ID token returned');
      const result = await authService.googleAuth(idToken);
      if (result.isNewUser) {
        router.push({ pathname: '/(auth)/google-complete', params: result.profile });
      } else {
        await setAuth(result.user, result.tokens);
        router.replace(result.user.role === 'landlord' ? '/(landlord)/dashboard' : '/(tenant)/home');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
      Alert.alert('Google Sign-Up Failed', error?.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSubmit = async (data: RegisterRequest) => {
    setLoading(true);
    try {
      const payload: RegisterRequest = {
        ...data,
        role,
        ...(role === 'tenant' ? { package: pkg } : {}),
      };
      const { email } = await authService.register(payload);
      router.replace({ pathname: '/(auth)/verify-email', params: { email } });
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message ?? 'Registration failed. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          <LinearGradient colors={theme.primaryGrad} style={styles.logoBox}>
            <Text style={{ fontSize: 28 }}>🏠</Text>
          </LinearGradient>
          <Text style={[typography.h2, { color: theme.textPrimary, marginTop: 20 }]}>Create account</Text>
          <Text style={[typography.body, { color: theme.textSecondary, marginTop: 4 }]}>
            Join thousands of Lagosians on AssetHub
          </Text>
        </Animated.View>

        {/* Google sign-up */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={{ marginBottom: 20 }}>
          <GoogleButton
            onPress={handleGoogleSignUp}
            loading={googleLoading}
            label="Sign up with Google"
          />
        </Animated.View>

        {/* Divider */}
        <Animated.View entering={FadeInDown.delay(70).springify()} style={[styles.divider, { marginBottom: 20 }]}>
          <View style={[styles.divLine, { backgroundColor: theme.border }]} />
          <Text style={[typography.caption, { color: theme.textMuted, marginHorizontal: 12 }]}>or sign up with email</Text>
          <View style={[styles.divLine, { backgroundColor: theme.border }]} />
        </Animated.View>

        {/* Role selector */}
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

        {/* Package selector — only for tenants */}
        {role === 'tenant' && (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
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

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <View style={styles.nameRow}>
            <Controller control={control} name="first_name" rules={{ required: 'Required' }}
              render={({ field: { onChange, value } }) => (
                <Input label="First name" placeholder="Emeka" value={value} onChangeText={onChange}
                  error={errors.first_name?.message as string} style={{ flex: 1 }} />
              )} />
            <View style={{ width: 12 }} />
            <Controller control={control} name="last_name" rules={{ required: 'Required' }}
              render={({ field: { onChange, value } }) => (
                <Input label="Last name" placeholder="Okafor" value={value} onChangeText={onChange}
                  error={errors.last_name?.message as string} style={{ flex: 1 }} />
              )} />
          </View>

          <Controller control={control} name="email"
            rules={{
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
            }}
            render={({ field: { onChange, value } }) => (
              <Input label="Email address" placeholder="emeka@gmail.com" keyboardType="email-address"
                autoCapitalize="none" value={value} onChangeText={onChange}
                error={errors.email?.message as string}
                leftIcon={<Text style={{ fontSize: 18 }}>📧</Text>} />
            )} />

          <Controller control={control} name="password"
            rules={{ required: 'Password required', minLength: { value: 8, message: 'Min 8 characters' } }}
            render={({ field: { onChange, value } }) => (
              <Input label="Password" placeholder="Min. 8 characters" secureTextEntry={!showPass}
                value={value} onChangeText={onChange} error={errors.password?.message as string}
                leftIcon={<Text style={{ fontSize: 18 }}>🔒</Text>}
                rightIcon={<Text style={{ fontSize: 16 }}>{showPass ? '🙈' : '👁'}</Text>}
                onRightPress={() => setShowPass(!showPass)} />
            )} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={{ gap: 14 }}>
          <Button title="Create Account" onPress={handleSubmit(onSubmit)} size="lg" loading={loading} />
          <View style={styles.loginRow}>
            <Text style={[typography.body, { color: theme.textSecondary }]}>Already have an account? </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={[typography.bodyMed, { color: theme.primaryLight }]}>Sign in</Text>
            </Pressable>
          </View>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll:       { flexGrow: 1, padding: 28, paddingTop: 70, gap: 0 },
  header:       { alignItems: 'center', marginBottom: 32 },
  logoBox:      { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  section:      { marginBottom: 16 },
  toggleRow:    { flexDirection: 'row', gap: 10 },
  toggleOption: { padding: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  nameRow:      { flexDirection: 'row' },
  loginRow:     { flexDirection: 'row', justifyContent: 'center' },
  divider:      { flexDirection: 'row', alignItems: 'center' },
  divLine:      { flex: 1, height: StyleSheet.hairlineWidth },
});
