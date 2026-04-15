import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { typography } from '../../constants/typography';
import { kycService } from '../../services/kyc.service';
import { useAuthStore } from '../../store/auth.store';

const STATUS_MAP: Record<string, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
  verified:   { variant: 'success', label: 'Verified' },
  pending:    { variant: 'warning', label: 'Pending'  },
  submitted:  { variant: 'warning', label: 'Pending'  },
  failed:     { variant: 'danger',  label: 'Failed'   },
  not_started:{ variant: 'danger',  label: 'Not Done' },
};

export default function KycReviewScreen() {
  const { theme } = useTheme();
  const { user }  = useAuthStore();
  const [status, setStatus]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    kycService.getStatus().then(setStatus).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const kycType   = status?.type ?? null;
  const kycStatus = status?.status ?? 'pending';

  const bvnStatus  = kycType ? 'verified' : 'not_started';
  const ninStatus  = kycType === 'nin' || kycType === 'bvn_nin' ? kycStatus : 'not_started';
  const phoneStatus = user?.is_verified ? 'verified' : 'pending';
  const emailStatus = user?.email ? 'verified' : 'not_started';

  const items = [
    { icon: '🏦', label: 'BVN Verification',  status: bvnStatus,   note: bvnStatus === 'verified' ? 'Identity confirmed via Paystack' : 'Not submitted' },
    { icon: '🎫', label: 'NIN Verification',   status: ninStatus,   note: ninStatus === 'verified' ? 'Identity confirmed' : ninStatus === 'not_started' ? 'Not submitted' : 'Under review · up to 24 hours' },
    { icon: '📱', label: 'Phone Number',       status: phoneStatus, note: phoneStatus === 'verified' ? 'OTP verified' : 'Pending verification' },
    { icon: '📧', label: 'Email Address',      status: emailStatus, note: emailStatus === 'verified' ? 'Email confirmed' : 'No email added' },
  ];

  const verifiedCount = items.filter(i => i.status === 'verified').length;
  const trustScore    = Math.round((verifiedCount / items.length) * 100);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={ZoomIn.delay(0).springify()} style={styles.header}>
        <LinearGradient colors={theme.primaryGrad} style={styles.successCircle}>
          <Text style={{ fontSize: 40 }}>✅</Text>
        </LinearGradient>
        <Text style={[typography.h2, { color: theme.textPrimary, marginTop: 20 }]}>
          KYC Submitted
        </Text>
        <Text style={[typography.body, { color: theme.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 22 }]}>
          Your verification is in progress. You can explore the app while we review.
        </Text>
      </Animated.View>

      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: 32 }} />
      ) : (
        <Animated.View entering={FadeInDown.delay(100).springify()}
          style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {items.map((item, i) => (
            <View key={item.label}>
              <View style={styles.row}>
                <View style={[styles.iconWrap, { backgroundColor: theme.background }]}>
                  <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>{item.label}</Text>
                  <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>{item.note}</Text>
                </View>
                <Badge label={STATUS_MAP[item.status]?.label ?? 'Pending'} variant={STATUS_MAP[item.status]?.variant ?? 'warning'} />
              </View>
              {i < items.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
            </View>
          ))}
        </Animated.View>
      )}

      {/* Trust score */}
      <Animated.View entering={FadeInDown.delay(180).springify()}
        style={[styles.scoreCard, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '44' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.bodyMed, { color: theme.primary }]}>Trust Score</Text>
          <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 2 }]}>
            Complete all verifications to unlock full access
          </Text>
        </View>
        <Text style={[typography.h2, { color: theme.primary }]}>{trustScore}%</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.actions}>
        <Button title="Go to Dashboard" onPress={() => router.replace('/(tenant)/home')} size="lg" />
        <Button title="Complete later" onPress={() => router.replace('/(tenant)/home')} variant="ghost" size="lg" />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { padding: 24, paddingTop: 60, paddingBottom: 40 },
  header:        { alignItems: 'center', marginBottom: 32 },
  successCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  card:          { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 16 },
  row:           { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconWrap:      { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  divider:       { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  scoreCard:     { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 32 },
  actions:       { gap: 12 },
});
