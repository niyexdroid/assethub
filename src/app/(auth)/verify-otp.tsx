import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';
import { typography } from '../../constants/typography';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';

const OTP_LENGTH = 6;

export default function VerifyOtpScreen() {
  const { theme }                   = useTheme();
  const { setAuth }                  = useAuthStore();
  const { phone_number, flow }       = useLocalSearchParams<{ phone_number: string; flow?: string }>();
  const [otp, setOtp]                = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer]            = useState(60);
  const [error, setError]            = useState('');
  const [loading, setLoading]        = useState(false);
  const inputs                       = useRef<(TextInput | null)[]>([]);
  const shakeX                       = useSharedValue(0);

  useEffect(() => {
    const id = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(id);
  }, []);

  const shakeAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }), withTiming(10, { duration: 50 }),
      withTiming(-8,  { duration: 50 }), withTiming(8,  { duration: 50 }),
      withTiming(0,   { duration: 50 })
    );
  };

  const handleChange = (val: string, i: number) => {
    const next = [...otp];
    next[i]    = val.slice(-1);
    setOtp(next);
    setError('');
    if (val && i < OTP_LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const handleKeyPress = (e: any, i: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const verify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) { setError('Enter the 6-digit code'); shake(); return; }

    setLoading(true);
    try {
      const response = await authService.verifyOtp({ phone_number, otp: code });
      await setAuth(response.user, response.tokens);
      if (flow === 'login') {
        router.replace(response.user.role === 'landlord' ? '/(landlord)/dashboard' : '/(tenant)/home');
      } else {
        router.replace('/(onboarding)/kyc-bvn');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Invalid code. Please try again.';
      setError(message);
      shake();
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await authService.requestOtp(phone_number);
      setTimer(60);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } catch {
      Alert.alert('Error', 'Could not resend code. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

      <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
        <LinearGradient colors={theme.primaryGrad} style={styles.iconBox}>
          <Text style={{ fontSize: 32 }}>💬</Text>
        </LinearGradient>
        <Text style={[typography.h2, { color: theme.textPrimary, marginTop: 20 }]}>Verify your number</Text>
        <Text style={[typography.body, { color: theme.textSecondary, marginTop: 6, textAlign: 'center' }]}>
          We sent a 6-digit code to your email{'\n'}linked to{' '}
          <Text style={{ color: theme.primaryLight, fontWeight: '700' }}>{phone_number}</Text>
        </Text>
      </Animated.View>

      {/* OTP boxes */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={[styles.otpRow, shakeAnim]}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={r => { inputs.current[i] = r; }}
            value={digit}
            onChangeText={v => handleChange(v, i)}
            onKeyPress={e => handleKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={1}
            style={[
              styles.otpBox,
              {
                backgroundColor: theme.surface,
                borderColor: digit  ? theme.primaryLight
                           : error  ? theme.danger
                           : theme.border,
                color: theme.textPrimary,
                ...typography.h2,
              }
            ]}
          />
        ))}
      </Animated.View>

      {error ? (
        <Animated.View entering={FadeInDown.springify()}>
          <Text style={[typography.caption, { color: theme.danger, textAlign: 'center', marginTop: 8 }]}>
            {error}
          </Text>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.actions}>
        <Button title="Verify" onPress={verify} size="lg"
          disabled={otp.join('').length < OTP_LENGTH} loading={loading} />

        <View style={styles.resendRow}>
          {timer > 0
            ? <Text style={[typography.body, { color: theme.textSecondary }]}>
                Resend code in <Text style={{ color: theme.primaryLight, fontWeight: '700' }}>{timer}s</Text>
              </Text>
            : <Pressable onPress={resend}>
                <Text style={[typography.bodyMed, { color: theme.primaryLight }]}>Resend code</Text>
              </Pressable>
          }
        </View>
      </Animated.View>

    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 100, paddingBottom: 40, alignItems: 'center' },
  header:    { alignItems: 'center', marginBottom: 40 },
  iconBox:   { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  otpRow:    { flexDirection: 'row', gap: 10, marginBottom: 8 },
  otpBox:    { width: 46, height: 56, borderRadius: 12, borderWidth: 2, textAlign: 'center' },
  actions:   { width: '100%', gap: 20, marginTop: 32 },
  resendRow: { alignItems: 'center' },
});
