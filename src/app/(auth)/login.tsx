import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';
import { GoogleButton } from '../../components/ui/GoogleButton';
import { Input }  from '../../components/ui/Input';
import { typography } from '../../constants/typography';
import { authService } from '../../services/auth.service';
import { getErrorMessage } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { LoginRequest } from '../../types/auth';

GoogleSignin.configure({ webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID });

export default function LoginScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { setAuth, biometricsEnabled } = useAuthStore();
  const [showPass, setShowPass]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [bioLoading, setBioLoading]   = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginRequest>();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
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
      Alert.alert('Google Sign-In Failed', getErrorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled  = await LocalAuthentication.isEnrolledAsync();
      const hasToken    = !!(await SecureStore.getItemAsync('refresh_token'));
      setBioAvailable(hasHardware && isEnrolled && hasToken && biometricsEnabled);
    })();
  }, [biometricsEnabled]);

  const handleBiometricLogin = async () => {
    setBioLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to AssetHub',
        fallbackLabel: 'Use password',
      });
      if (!result.success) return;

      const [refreshToken, userJson] = await Promise.all([
        SecureStore.getItemAsync('refresh_token'),
        SecureStore.getItemAsync('user'),
      ]);
      if (!refreshToken || !userJson) {
        Alert.alert('Session expired', 'Please sign in with your email and password.');
        return;
      }

      const tokens = await authService.refresh(refreshToken);
      const user   = JSON.parse(userJson);
      await setAuth(user, tokens);
      router.replace(user.role === 'landlord' ? '/(landlord)/dashboard' : '/(tenant)/home');
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setBioLoading(false);
    }
  };

  const onSubmit = async (data: LoginRequest) => {
    setLoading(true);
    try {
      const { login_token } = await authService.login(data);
      router.push({
        pathname: '/(auth)/verify-login-otp',
        params: { login_token, email: data.email },
      });
    } catch (error: any) {
      if (error?.response?.data?.message === 'EMAIL_NOT_VERIFIED') {
        router.push({ pathname: '/(auth)/verify-email', params: { email: data.email } });
        return;
      }
      Alert.alert('Login Failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { login_token } = await authService.login({ email, password });
      router.push({
        pathname: '/(auth)/verify-login-otp',
        params: { login_token, email },
      });
    } catch (error: any) {
      if (error?.response?.data?.message === 'EMAIL_NOT_VERIFIED') {
        router.push({ pathname: '/(auth)/verify-email', params: { email } });
        return;
      }
      Alert.alert('Login Failed', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Logo / Header */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          <LinearGradient colors={theme.primaryGrad} style={styles.logoBox}>
            <Ionicons name="home" size={30} color="#fff" />
          </LinearGradient>
          <Text style={[typography.h2, { color: theme.textPrimary, marginTop: 20 }]}>
            Welcome back
          </Text>
          <Text style={[typography.body, { color: theme.textSecondary, marginTop: 4 }]}>
            Sign in to your AssetHub account
          </Text>
        </Animated.View>

        {/* Google sign-in */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={{ marginBottom: 16 }}>
          <GoogleButton
            onPress={handleGoogleSignIn}
            loading={googleLoading}
            label="Continue with Google"
          />
        </Animated.View>

        {/* Divider */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={[styles.divider, { marginBottom: 20 }]}>
          <View style={[styles.line, { backgroundColor: theme.border }]} />
          <Text style={[typography.caption, { color: theme.textMuted, marginHorizontal: 12 }]}>or sign in with email</Text>
          <View style={[styles.line, { backgroundColor: theme.border }]} />
        </Animated.View>

        {/* Biometric button — shown only when available + enabled */}
        {bioAvailable && (
          <Animated.View entering={FadeInDown.delay(60).springify()} style={{ marginBottom: 20 }}>
            <Pressable
              onPress={handleBiometricLogin}
              disabled={bioLoading}
              style={[styles.bioBtn, { backgroundColor: theme.surface, borderColor: theme.primary }]}
            >
              <Ionicons name="finger-print" size={26} color={theme.primary} />
              <Text style={[typography.bodyMed, { color: theme.primaryLight }]}>
                {bioLoading ? 'Authenticating…' : 'Sign in with biometrics'}
              </Text>
            </Pressable>

            <View style={[styles.divider, { marginTop: 20 }]}>
              <View style={[styles.line, { backgroundColor: theme.border }]} />
              <Text style={[typography.caption, { color: theme.textMuted, marginHorizontal: 12 }]}>or use password</Text>
              <View style={[styles.line, { backgroundColor: theme.border }]} />
            </View>
          </Animated.View>
        )}

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.form}>
          <Controller
            control={control}
            name="email"
            rules={{
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email address"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                error={errors.email?.message as string}
                leftIcon={<Ionicons name="mail-outline" size={18} color={theme.textMuted} />}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{ required: 'Password is required' }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Password"
                placeholder="Enter your password"
                secureTextEntry={!showPass}
                value={value}
                onChangeText={onChange}
                error={errors.password?.message as string}
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} />}
                rightIcon={<Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.textMuted} />}
                onRightPress={() => setShowPass(!showPass)}
              />
            )}
          />

          <Pressable onPress={() => router.push('/(auth)/forgot-password')}
            style={{ alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 }}>
            <Text style={[typography.label, { color: theme.primaryLight }]}>Forgot password?</Text>
          </Pressable>

          <Button title="Continue" onPress={handleSubmit(onSubmit)} size="lg" loading={loading} />
        </Animated.View>

        {/* Register CTA */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.register, { marginTop: 24 }]}>
          <Text style={[typography.body, { color: theme.textSecondary }]}>Don't have an account? </Text>
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text style={[typography.bodyMed, { color: theme.primaryLight }]}>Sign up free</Text>
          </Pressable>
        </Animated.View>

        {/* DEV QUICK LOGIN */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.devSection}>
          <View style={[styles.devHeader, { borderColor: theme.border }]}>
            <Ionicons name="code-slash-outline" size={13} color={theme.textMuted} />
            <Text style={[typography.caption, { color: theme.textMuted, marginLeft: 5 }]}>DEV QUICK LOGIN</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => quickLogin('niyexdroid@gmail.com', 'passwordtn')}
              style={[styles.devBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Ionicons name="person-outline" size={15} color={theme.primary} />
              <Text style={[typography.small, { color: theme.primary, fontWeight: '600' }]}>Tenant</Text>
            </Pressable>
            <Pressable
              onPress={() => quickLogin('niyexdroid@outlook.com', 'passwordld')}
              style={[styles.devBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Ionicons name="business-outline" size={15} color={theme.accent} />
              <Text style={[typography.small, { color: theme.accent, fontWeight: '600' }]}>Landlord</Text>
            </Pressable>
          </View>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll:      { flexGrow: 1, padding: 28, paddingTop: 80, paddingBottom: 40 },
  header:      { alignItems: 'center', marginBottom: 40 },
  logoBox:     { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  bioBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 16, borderRadius: 16, borderWidth: 1.5 },
  divider:     { flexDirection: 'row', alignItems: 'center' },
  line:        { flex: 1, height: StyleSheet.hairlineWidth },
  form:        { gap: 0 },
  register:    { flexDirection: 'row', justifyContent: 'center' },
  devSection:  { marginTop: 32 },
  devHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  devBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
});
