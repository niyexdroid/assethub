import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { typography } from '../../constants/typography';
import { authService } from '../../services/auth.service';

const OTP_LENGTH = 6;

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const [step, setStep]       = useState<'phone' | 'reset'>('phone');
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer]     = useState(60);
  const [error, setError]     = useState('');
  const inputs = useRef<(TextInput | null)[]>([]);
  const shakeX = useSharedValue(0);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<{
    phone_number: string;
    new_password: string;
    confirm_password: string;
  }>();

  useEffect(() => {
    if (step !== 'reset') return;
    const id = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(id);
  }, [step]);

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

  const handleOtpChange = (val: string, i: number) => {
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    setError('');
    if (val && i < OTP_LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const handleOtpKeyPress = (e: any, i: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const onSendOtp = async (data: { phone_number: string }) => {
    setLoading(true);
    try {
      await authService.forgotPassword(data.phone_number);
      setPhone(data.phone_number);
      setTimer(60);
      setStep('reset');
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not send OTP. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const onReset = async (data: { new_password: string }) => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) { setError('Enter the 6-digit code'); shake(); return; }

    setLoading(true);
    try {
      await authService.resetPassword({ phone_number: phone, otp: code, new_password: data.new_password });
      Alert.alert('Success', 'Password reset successfully. Please sign in.', [
        { text: 'Sign In', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Reset failed. Please try again.';
      setError(message);
      shake();
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      await authService.forgotPassword(phone);
      setTimer(60);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } catch {
      Alert.alert('Error', 'Could not resend OTP.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          <LinearGradient colors={theme.primaryGrad} style={styles.iconBox}>
            <Text style={{ fontSize: 28 }}>🔑</Text>
          </LinearGradient>
          <Text style={[typography.h2, { color: theme.textPrimary, marginTop: 20 }]}>
            {step === 'phone' ? 'Forgot password?' : 'Reset password'}
          </Text>
          <Text style={[typography.body, { color: theme.textSecondary, marginTop: 6, textAlign: 'center' }]}>
            {step === 'phone'
              ? 'Enter your registered phone number and we\'ll send you a code.'
              : `Enter the code sent to ${phone} and your new password.`}
          </Text>
        </Animated.View>

        {step === 'phone' ? (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.form}>
            <Controller control={control} name="phone_number"
              rules={{
                required: 'Phone number is required',
                pattern: { value: /^(\+234|0)[789]\d{9}$/, message: 'Invalid Nigerian number' },
              }}
              render={({ field: { onChange, value } }) => (
                <Input label="Phone number" placeholder="08012345678" keyboardType="phone-pad"
                  value={value} onChangeText={onChange}
                  error={errors.phone_number?.message as string}
                  leftIcon={<Text style={{ fontSize: 18 }}>📱</Text>} />
              )} />
            <Button title="Send Code" onPress={handleSubmit(onSendOtp)} size="lg" loading={loading} />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.form}>

            {/* OTP boxes */}
            <Animated.View style={[styles.otpRow, shakeAnim]}>
              {otp.map((digit, i) => (
                <TextInput key={i}
                  ref={r => { inputs.current[i] = r; }}
                  value={digit}
                  onChangeText={v => handleOtpChange(v, i)}
                  onKeyPress={e => handleOtpKeyPress(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={[styles.otpBox, {
                    backgroundColor: theme.surface,
                    borderColor: digit ? theme.primaryLight : error ? theme.danger : theme.border,
                    color: theme.textPrimary,
                    ...typography.h2,
                  }]}
                />
              ))}
            </Animated.View>

            {error ? (
              <Text style={[typography.caption, { color: theme.danger, textAlign: 'center', marginBottom: 8 }]}>
                {error}
              </Text>
            ) : null}

            {/* Resend timer */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              {timer > 0
                ? <Text style={[typography.body, { color: theme.textSecondary }]}>
                    Resend in <Text style={{ color: theme.primaryLight, fontWeight: '700' }}>{timer}s</Text>
                  </Text>
                : <Pressable onPress={resendOtp}>
                    <Text style={[typography.bodyMed, { color: theme.primaryLight }]}>Resend code</Text>
                  </Pressable>
              }
            </View>

            <Controller control={control} name="new_password"
              rules={{ required: 'New password required', minLength: { value: 8, message: 'Min 8 characters' } }}
              render={({ field: { onChange, value } }) => (
                <Input label="New password" placeholder="Min. 8 characters"
                  secureTextEntry={!showPass} value={value} onChangeText={onChange}
                  error={errors.new_password?.message as string}
                  leftIcon={<Text style={{ fontSize: 18 }}>🔒</Text>}
                  rightIcon={<Text style={{ fontSize: 16 }}>{showPass ? '🙈' : '👁'}</Text>}
                  onRightPress={() => setShowPass(!showPass)} />
              )} />

            <Controller control={control} name="confirm_password"
              rules={{
                required: 'Please confirm your password',
                validate: v => v === watch('new_password') || 'Passwords do not match',
              }}
              render={({ field: { onChange, value } }) => (
                <Input label="Confirm password" placeholder="Repeat new password"
                  secureTextEntry={!showConfirm} value={value} onChangeText={onChange}
                  error={errors.confirm_password?.message as string}
                  leftIcon={<Text style={{ fontSize: 18 }}>🔒</Text>}
                  rightIcon={<Text style={{ fontSize: 16 }}>{showConfirm ? '🙈' : '👁'}</Text>}
                  onRightPress={() => setShowConfirm(!showConfirm)} />
              )} />

            <Button title="Reset Password" onPress={handleSubmit(onReset)} size="lg" loading={loading} />
          </Animated.View>
        )}

        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={[typography.bodyMed, { color: theme.primaryLight }]}>← Back to Sign In</Text>
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll:   { flexGrow: 1, padding: 28, paddingTop: 70 },
  header:   { alignItems: 'center', marginBottom: 36 },
  iconBox:  { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  form:     { gap: 16 },
  otpRow:   { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 8 },
  otpBox:   { width: 46, height: 56, borderRadius: 12, borderWidth: 2, textAlign: 'center' },
  back:     { alignItems: 'center', marginTop: 32 },
});
