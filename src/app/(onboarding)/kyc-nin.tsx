import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { kycService } from '../../services/kyc.service';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { typography } from '../../constants/typography';

const schema = z.object({
  nin: z.string().length(11, 'NIN must be 11 digits').regex(/^\d+$/, 'NIN must be numeric only'),
});
type FormData = z.infer<typeof schema>;

const STEPS = ['BVN', 'NIN', 'Review'];

export default function KycNinScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await kycService.submitNin(data.nin);
      router.push('/(onboarding)/kyc-review');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not verify NIN.');
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
                  backgroundColor: i <= 1 ? theme.primary : theme.border,
                  borderColor:     i <= 1 ? theme.primary : theme.border,
                }
              ]}>
                {i === 0
                  ? <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>
                  : <Text style={{ color: i === 1 ? '#fff' : theme.textMuted, fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>
                }
              </View>
              <Text style={[typography.caption, { color: i <= 1 ? theme.primary : theme.textMuted, marginTop: 4 }]}>
                {s}
              </Text>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, { backgroundColor: i === 0 ? theme.primary : theme.border }]} />
              )}
            </View>
          ))}
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.header}>
          <LinearGradient colors={theme.primaryGrad} style={styles.iconBox}>
            <Text style={{ fontSize: 32 }}>🎫</Text>
          </LinearGradient>
          <Text style={[typography.h2, { color: theme.textPrimary, marginTop: 20 }]}>
            National ID Number
          </Text>
          <Text style={[typography.body, { color: theme.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 22 }]}>
            Your NIN links you to Nigeria's national identity database for full verification.
          </Text>
        </Animated.View>

        {/* Status badge */}
        <Animated.View entering={FadeInDown.delay(120).springify()}
          style={[styles.statusCard, { backgroundColor: theme.warning + '18', borderColor: theme.warning + '44' }]}>
          <Text style={{ fontSize: 18, marginRight: 10 }}>⏳</Text>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyMed, { color: theme.warning }]}>Manual Review</Text>
            <Text style={[typography.small, { color: theme.textSecondary, marginTop: 2, lineHeight: 18 }]}>
              NIN verification is reviewed within 24 hours. You can use the app while we review.
            </Text>
          </View>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.form}>
          <Controller
            control={control}
            name="nin"
            render={({ field: { onChange, value } }) => (
              <Input
                label="National Identity Number (NIN)"
                placeholder="Enter your 11-digit NIN"
                value={value}
                onChangeText={onChange}
                keyboardType="number-pad"
                maxLength={11}
                error={errors.nin?.message}
                hint="Dial *346# to retrieve your NIN"
                leftIcon={<Text style={{ fontSize: 16 }}>🇳🇬</Text>}
              />
            )}
          />

          <View style={styles.badgeRow}>
            <Badge label="NIMC verified" variant="info" />
            <Badge label="Encrypted" variant="success" />
          </View>

          <Button
            title="Submit NIN"
            onPress={handleSubmit(onSubmit)}
            size="lg"
            loading={loading}
          />

          <Button
            title="Skip for now"
            onPress={() => router.push('/(onboarding)/kyc-review')}
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
  statusCard: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 24 },
  form:       { gap: 16 },
  badgeRow:   { flexDirection: 'row', gap: 8 },
});
