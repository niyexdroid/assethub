import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';
import { kycService } from '../../services/kyc.service';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { typography } from '../../constants/typography';

const schema = z.object({
  bvn: z.string().length(11, 'BVN must be 11 digits').regex(/^\d+$/, 'BVN must be numeric only'),
});
type FormData = z.infer<typeof schema>;

const STEPS = ['BVN', 'NIN', 'Review'];

export default function KycBvnScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await kycService.submitBvn(data.bvn);
      router.push('/(onboarding)/kyc-nin');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not verify BVN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Progress Steps */}
        <Animated.View entering={FadeInUp.delay(0).springify()} style={styles.stepsRow}>
          {STEPS.map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View style={[
                styles.stepDot,
                {
                  backgroundColor: i === 0 ? theme.primary : theme.border,
                  borderColor: i === 0 ? theme.primary : theme.border,
                }
              ]}>
                <Text style={{ color: i === 0 ? '#fff' : theme.textMuted, fontSize: 11, fontWeight: '700' }}>
                  {i + 1}
                </Text>
              </View>
              <Text style={[typography.caption, { color: i === 0 ? theme.primary : theme.textMuted, marginTop: 4 }]}>
                {s}
              </Text>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, { backgroundColor: theme.border }]} />
              )}
            </View>
          ))}
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.header}>
          <LinearGradient colors={theme.primaryGrad} style={styles.iconBox}>
            <Text style={{ fontSize: 32 }}>🪪</Text>
          </LinearGradient>
          <Text style={[typography.h2, { color: theme.textPrimary, marginTop: 20 }]}>
            Verify your identity
          </Text>
          <Text style={[typography.body, { color: theme.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 22 }]}>
            Your BVN confirms your identity. We never store the raw number — it's encrypted at rest.
          </Text>
        </Animated.View>

        {/* Info card */}
        <Animated.View entering={FadeInDown.delay(120).springify()}
          style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.primaryLight + '33' }]}>
          <Text style={{ fontSize: 20, marginBottom: 6 }}>🔒</Text>
          <Text style={[typography.small, { color: theme.textSecondary, textAlign: 'center', lineHeight: 20 }]}>
            Your BVN is used only for identity verification via Paystack. It is encrypted with AES-256-CBC and never shared with landlords.
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.form}>
          <Controller
            control={control}
            name="bvn"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Bank Verification Number (BVN)"
                placeholder="Enter your 11-digit BVN"
                value={value}
                onChangeText={onChange}
                keyboardType="number-pad"
                maxLength={11}
                error={errors.bvn?.message}
                hint="Dial *565*0# to retrieve your BVN"
                leftIcon={<Text style={{ fontSize: 16 }}>🏦</Text>}
              />
            )}
          />

          <View style={styles.badgeRow}>
            <Badge label="256-bit encrypted" variant="success" />
            <Badge label="Not shared" variant="info" />
            <Badge label="NDPR compliant" variant="warning" />
          </View>

          <Button
            title="Verify BVN"
            onPress={handleSubmit(onSubmit)}
            size="lg"
            loading={loading}
          />

          <Button
            title="Skip for now"
            onPress={() => router.push('/(onboarding)/kyc-nin')}
            variant="ghost"
            size="lg"
          />
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { padding: 24, paddingTop: 60, paddingBottom: 40 },
  stepsRow:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', marginBottom: 32, gap: 4 },
  stepItem:   { alignItems: 'center', position: 'relative', width: 60 },
  stepDot:    { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stepLine:   { position: 'absolute', top: 14, left: '60%', width: 44, height: 2, zIndex: -1 },
  header:     { alignItems: 'center', marginBottom: 24 },
  iconBox:    { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  infoCard:   { borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center', marginBottom: 28 },
  form:       { gap: 16 },
  badgeRow:   { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
