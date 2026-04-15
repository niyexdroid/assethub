import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';
import { Button } from '../../../components/ui/Button';
import { typography } from '../../../constants/typography';
import { paymentsService } from '../../../services/payments.service';

type PayStatus = 'loading' | 'webview' | 'success' | 'failed';

export default function PayScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams<{
    tenancy_id?: string; tenancyId?: string;
    schedule_id?: string; scheduleId?: string;
    amount: string;
    label: string;
  }>();
  const tenancy_id  = params.tenancy_id  ?? params.tenancyId  ?? '';
  const schedule_id = params.schedule_id ?? params.scheduleId ?? undefined;
  const { amount, label } = params;
  const [status, setStatus]     = useState<PayStatus>('loading');
  const [authUrl, setAuthUrl]   = useState('');
  const [reference, setReference] = useState('');
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!tenancy_id) return;
    (async () => {
      try {
        const res = await paymentsService.initialize({
          tenancy_id,
          schedule_id: schedule_id ?? undefined,
          amount: amount ? Number(amount) : undefined,
        });
        setAuthUrl(res.authorization_url);
        setReference(res.reference);
        setStatus('webview');
      } catch (e: any) {
        setError(e?.response?.data?.message ?? 'Could not initialize payment.');
        setStatus('failed');
      }
    })();
  }, [tenancy_id]);

  const handleNavChange = useCallback((navState: { url: string }) => {
    const url = navState.url;
    if (url.includes('propman://payment/success') || url.includes('/payment/callback?status=success') || url.includes('paystack.com/close')) {
      setStatus('success');
    } else if (url.includes('propman://payment/failed') || url.includes('/payment/callback?status=failed')) {
      setStatus('failed');
    }
  }, []);

  if (status === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[typography.body, { color: theme.textSecondary, marginTop: 16 }]}>
          Preparing secure checkout...
        </Text>
      </View>
    );
  }

  if (status === 'success') {
    return (
      <Animated.View entering={FadeIn} style={[styles.center, { backgroundColor: theme.background }]}>
        <View style={[styles.statusIcon, { backgroundColor: '#4ADE8022' }]}>
          <Ionicons name="checkmark-circle" size={64} color="#4ADE80" />
        </View>
        <Text style={[typography.h2, { color: theme.textPrimary, textAlign: 'center', marginTop: 20 }]}>
          Payment Successful!
        </Text>
        <Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 }]}>
          {'\u20A6'}{Number(amount).toLocaleString('en-NG')} for {label} has been processed.{'\n'}
          Your landlord has been notified.
        </Text>
        <View style={{ width: '100%', paddingHorizontal: 24, gap: 12, marginTop: 32 }}>
          <Button title="View Receipt" onPress={() => router.push({ pathname: '/(tenant)/payments/receipt', params: { ref: reference } })} size="lg" />
          <Button title="Back to Payments" onPress={() => router.replace('/(tenant)/payments')} variant="outline" size="lg" />
        </View>
      </Animated.View>
    );
  }

  if (status === 'failed') {
    return (
      <Animated.View entering={FadeIn} style={[styles.center, { backgroundColor: theme.background }]}>
        <View style={[styles.statusIcon, { backgroundColor: '#FF6B6B22' }]}>
          <Ionicons name="close-circle" size={64} color="#FF6B6B" />
        </View>
        <Text style={[typography.h2, { color: theme.textPrimary, marginTop: 20 }]}>Payment Failed</Text>
        <Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center', marginTop: 8 }]}>
          {error || 'Something went wrong. Your card was not charged.'}
        </Text>
        <View style={{ width: '100%', paddingHorizontal: 24, gap: 12, marginTop: 32 }}>
          <Button title="Try Again" onPress={() => { setError(''); setStatus('loading'); }} size="lg" />
          <Button title="Cancel" onPress={() => router.back()} variant="ghost" size="lg" />
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Button title="Cancel" onPress={() => router.back()} variant="ghost" size="sm" />
        <View style={{ alignItems: 'center' }}>
          <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>Secure Checkout</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="lock-closed" size={11} color={theme.textMuted} />
            <Text style={[typography.caption, { color: theme.textMuted }]}>Powered by Paystack</Text>
          </View>
        </View>
        <View style={{ width: 70 }} />
      </View>
      <WebView
        source={{ uri: authUrl }}
        onNavigationStateChange={handleNavChange}
        startInLoadingState
        renderLoading={() => (
          <View style={[styles.center, { backgroundColor: theme.background }]}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}
        style={{ flex: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1 },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  statusIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
