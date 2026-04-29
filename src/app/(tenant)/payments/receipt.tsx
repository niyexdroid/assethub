import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { typography } from '../../../constants/typography';
import { paymentsService, PaymentTransaction } from '../../../services/payments.service';
import { formatNGN } from '../../../utils/format';

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={styles.receiptRow}>
      <Text style={[typography.body, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[bold ? typography.bodyMed : typography.body, { color: theme.textPrimary }]}>{value}</Text>
    </View>
  );
}

export default function ReceiptScreen() {
  const { theme }  = useTheme();
  const insets     = useSafeAreaInsets();
  // accepts either `ref` (Paystack reference) or `id` (transaction ID)
  const { ref, id } = useLocalSearchParams<{ ref?: string; id?: string }>();
  const [tx, setTx]         = useState<PaymentTransaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        if (ref) {
          const res = await paymentsService.verify(ref);
          setTx(res.transaction);
        } else if (id) {
          const res = await paymentsService.getTransaction(id);
          setTx(res);
        }
      } catch { /* show fallback */ }
      finally { setLoading(false); }
    };
    fetch();
  }, [ref, id]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // If no tx data, show a minimal confirmation screen
  const displayAmount = tx?.amount ?? 0;
  const platformFee   = Math.round(displayAmount * 0.015);
  const total         = displayAmount + platformFee;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Success ring */}
      <Animated.View entering={ZoomIn.delay(0).springify()} style={{ alignItems: 'center', marginBottom: 28 }}>
        <LinearGradient colors={theme.primaryGrad} style={styles.successRing}>
          <Ionicons name="checkmark" size={42} color="#fff" />
        </LinearGradient>
        <Text style={[typography.h2, { color: theme.textPrimary, marginTop: 16 }]}>Payment Receipt</Text>
        <Badge label="Confirmed" variant="success" />
      </Animated.View>

      {/* Amount card */}
      <Animated.View entering={FadeInDown.delay(80).springify()}>
        <LinearGradient colors={theme.primaryGrad} style={styles.amountCard}>
          <Text style={[typography.small, { color: 'rgba(255,255,255,0.7)' }]}>Amount Paid</Text>
          <Text style={[typography.price, { color: '#fff', marginTop: 4 }]}>
            {formatNGN(total)}
          </Text>
          {platformFee > 0 && (
            <Text style={[typography.caption, { color: 'rgba(255,255,255,0.6)', marginTop: 6 }]}>
              Includes {formatNGN(platformFee)} platform fee
            </Text>
          )}
        </LinearGradient>
      </Animated.View>

      {/* Details */}
      <Animated.View entering={FadeInDown.delay(140).springify()}
        style={[styles.receiptCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {tx?.reference && <><Row label="Reference" value={tx.reference} bold /><View style={[styles.divider, { backgroundColor: theme.border }]} /></>}
        {tx?.property_title && <><Row label="Property" value={tx.property_title} /><View style={[styles.divider, { backgroundColor: theme.border }]} /></>}
        <Row label="Date & Time" value={tx ? new Date(tx.paid_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : '—'} />
        {tx?.channel && <><View style={[styles.divider, { backgroundColor: theme.border }]} /><Row label="Method" value={tx.channel} /></>}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Row label="Rent amount" value={formatNGN(displayAmount)} />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Row label="Platform fee" value={formatNGN(platformFee)} />
        <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
          <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>Total charged</Text>
          <Text style={[typography.h3, { color: theme.primary }]}>
            {formatNGN(total)}
          </Text>
        </View>
      </Animated.View>

      {/* Actions */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.actions}>
        <Button title="Back to Payments" onPress={() => router.replace('/(tenant)/payments')} size="lg" />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { padding: 24, paddingBottom: 40 },
  successRing: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  amountCard:  { borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 16 },
  receiptCard: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 24 },
  receiptRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  divider:     { height: StyleSheet.hairlineWidth },
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopWidth: 2 },
  actions:     { gap: 12 },
});
