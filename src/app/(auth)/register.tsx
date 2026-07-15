import React, { useState } from 'react';
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
import { Input } from '../../components/ui/Input';
import { typography } from '../../constants/typography';
import { authService } from '../../services/auth.service';
import { getErrorMessage } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { LoginRequest } from '../../types/auth';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
});

export default function RegisterScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginRequest>();

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut(); // clear any stale cached session
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
      Alert.alert('Google Sign-Up Failed', getErrorMessage(error));
    } finally {
      setGoogleLoading(false);
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
      Alert.alert('Error', getErrorMessage(error));
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

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
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
        </Animated.View>

        <Text style={[typography.caption, { color: theme.textMuted, marginTop: -8, marginBottom: 20 }]}>
          We'll email you a 6-digit code — no password needed.
        </Text>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={{ gap: 14 }}>
          <Button title="Continue" onPress={handleSubmit(onSubmit)} size="lg" loading={loading} />
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
  loginRow:     { flexDirection: 'row', justifyContent: 'center' },
  divider:      { flexDirection: 'row', alignItems: 'center' },
  divLine:      { flex: 1, height: StyleSheet.hairlineWidth },
});
