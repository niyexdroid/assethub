import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { Badge }  from '../../../components/ui/Badge';
import { typography } from '../../../constants/typography';
import { paymentsService, PaymentTransaction } from '../../../services/payments.service';
import { formatNGN } from '../../../utils/format';

const STATUS_CONFIG: Record<string, { variant: 'success' | 'danger' | 'warning'; icon: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  success: { variant: 'success', icon: 'checkmark-circle-outline', color: '#4ADE80' },
  failed:  { variant: 'danger',  icon: 'close-circle-outline',     color: '#FF6B6B' },
  pending: { variant: 'warning', icon: 'time-outline',             color: '#FFA040' },
};

export default function LandlordPaymentsScreen() {
  const { theme }                     = useTheme();
  const insets                        = useSafeAreaInsets();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      const result = await paymentsService.getHistory();
      setTransactions(Array.isArray(result) ? result : result.data ?? []);
    } catch { /* show empty */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalReceived = transactions.filter(t => t.status === 'success').reduce((s, t) => s + t.amount, 0);
  const totalPending  = transactions.filter(t => t.status === 'pending').reduce((s, t) => s + t.amount, 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
    >
      <Animated.View entering={FadeInDown.delay(0).springify()} style={{ marginBottom: 20 }}>
        <Text style={[typography.h2, { color: theme.textPrimary }]}>Payments</Text>
        <Text style={[typography.small, { color: theme.textMuted }]}>All received rent payments</Text>
      </Animated.View>

      {/* Banner */}
      <Animated.View entering={FadeInDown.delay(60).springify()}>
        <LinearGradient colors={theme.primaryGrad} style={styles.banner}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.label, { color: 'rgba(255,255,255,0.75)' }]}>Total Received</Text>
            <Text style={[typography.price, { color: '#fff', marginTop: 4 }]}>
              {formatNGN(totalReceived)}
            </Text>
          </View>
          <View style={styles.bannerRight}>
            <Text style={[typography.caption, { color: 'rgba(255,255,255,0.7)' }]}>Pending</Text>
            <Text style={[typography.bodyMed, { color: '#FFA040' }]}>
              {formatNGN(totalPending)}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <Text style={[typography.label, { color: theme.textMuted, marginBottom: 12, marginTop: 24 }]}>TRANSACTIONS</Text>

      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
      ) : transactions.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={48} color={theme.textMuted} />
          <Text style={[typography.bodyMed, { color: theme.textPrimary, marginTop: 16 }]}>No payments yet</Text>
          <Text style={[typography.small, { color: theme.textMuted, marginTop: 6, textAlign: 'center' }]}>
            Payments from your tenants will appear here.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {transactions.map((tx, i) => {
            const cfg = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending;
            return (
              <Animated.View key={tx.id} entering={FadeInDown.delay(100 + i * 50).springify()}>
                <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={[styles.rowIcon, { backgroundColor: theme.background }]}>
                    <Ionicons name={cfg.icon} size={22} color={cfg.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>
                      {tx.property_title ?? 'Property'}
                    </Text>
                    <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>
                      Ref: {tx.reference}
                    </Text>
                    <Text style={[typography.caption, { color: theme.textMuted }]}>
                      {new Date(tx.paid_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={[typography.bodyMed, { color: tx.status === 'success' ? theme.success : theme.textPrimary }]}>
                      {formatNGN(tx.amount)}
                    </Text>
                    <Badge
                      label={tx.status === 'success' ? 'Received' : tx.status === 'failed' ? 'Failed' : 'Pending'}
                      variant={cfg.variant}
                    />
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { padding: 20 },
  banner:      { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  bannerRight: { alignItems: 'flex-end' },
  row:         { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  rowIcon:     { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  empty:       { alignItems: 'center', paddingTop: 40, paddingHorizontal: 40 },
});
