import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';
import { Input }  from '../../components/ui/Input';
import { typography } from '../../constants/typography';
import { authService } from '../../services/auth.service';
import { getErrorMessage } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { LoginRequest } from '../../types/auth';

export default function LoginScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [phone, setPhone]         = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<LoginRequest>();

  const quickLogin = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login({ identifier, password });
      await setAuth(response.user, response.tokens);
      if (response.user.role === 'landlord') {
        router.replace('/(landlord)/dashboard');
      } else {
        router.replace('/(tenant)/home');
      }
    } catch (error: any) {
      const message = getErrorMessage(error);
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const loginWithOtp = async () => {
    if (!phone.trim()) { Alert.alert('Enter your phone number'); return; }
    setOtpLoading(true);
    try {
      await authService.requestOtp(phone.trim());
      router.push({ pathname: '/(auth)/verify-otp', params: { phone_number: phone.trim(), flow: 'login' } });
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not send OTP. Try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const onSubmit = async (data: LoginRequest) => {
    setLoading(true);
    try {
      const response = await authService.login(data);
      await setAuth(response.user, response.tokens);
      if (response.user.role === 'landlord') {
        router.replace('/(landlord)/dashboard');
      } else {
        router.replace('/(tenant)/home');
      }
    } catch (error: any) {
      const message = getErrorMessage(error);
      Alert.alert('Login Failed', message);
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

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.form}>
          <Controller
            control={control}
            name="identifier"
            rules={{ required: 'Phone or email is required' }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Phone number or email"
                placeholder="08012345678"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                error={errors.identifier?.message as string}
                leftIcon={<Ionicons name="phone-portrait-outline" size={18} color={theme.textMuted} />}
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

          <Button title="Sign In" onPress={handleSubmit(onSubmit)} size="lg" loading={loading} />
        </Animated.View>

        {/* Divider */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.divider}>
          <View style={[styles.line, { backgroundColor: theme.border }]} />
          <Text style={[typography.caption, { color: theme.textMuted, marginHorizontal: 12 }]}>or login with OTP</Text>
          <View style={[styles.line, { backgroundColor: theme.border }]} />
        </Animated.View>

        {/* OTP Login */}
        <Animated.View entering={FadeInDown.delay(250).springify()} style={{ gap: 10 }}>
          <Input
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            leftIcon={<Ionicons name="phone-portrait-outline" size={18} color={theme.textMuted} />}
          />
          <Button
            title="Send OTP Code"
            onPress={loginWithOtp}
            size="lg"
            variant="outline"
            loading={otpLoading}
          />
        </Animated.View>

        {/* Register CTA */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={[styles.register, { marginTop: 24 }]}>
          <Text style={[typography.body, { color: theme.textSecondary }]}>Don't have an account? </Text>
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text style={[typography.bodyMed, { color: theme.primaryLight }]}>Sign up free</Text>
          </Pressable>
        </Animated.View>

        {/* DEV QUICK LOGIN */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.devSection}>
          <View style={[styles.devHeader, { borderColor: theme.border }]}>
            <Ionicons name="code-slash-outline" size={13} color={theme.textMuted} />
            <Text style={[typography.caption, { color: theme.textMuted, marginLeft: 5 }]}>DEV QUICK LOGIN</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => quickLogin('08100000001', 'passwordtn')}
              style={[styles.devBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Ionicons name="person-outline" size={15} color={theme.primary} />
              <Text style={[typography.small, { color: theme.primary, fontWeight: '600' }]}>Tenant</Text>
            </Pressable>
            <Pressable
              onPress={() => quickLogin('08100000002', 'passwordld')}
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
  form:        { gap: 0 },
  divider:     { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line:        { flex: 1, height: StyleSheet.hairlineWidth },
  register:    { flexDirection: 'row', justifyContent: 'center' },
  devSection:  { marginTop: 32 },
  devHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  devBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
});
