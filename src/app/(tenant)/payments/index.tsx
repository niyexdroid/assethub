import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { Badge } from '../../../components/ui/Badge';
import { typography } from '../../../constants/typography';
import { tenanciesService } from '../../../services/tenancies.service';
import { paymentsService, PaymentScheduleItem } from '../../../services/payments.service';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const STATUS_CONFIG: Record<string, { variant: 'danger' | 'warning' | 'success'; label: string; icon: IoniconsName; iconColor: string }> = {
  overdue:         { variant: 'danger',  label: 'Overdue', icon: 'alert-circle-outline',     iconColor: '#FF6B6B' },
  pending:         { variant: 'warning', label: 'Due',     icon: 'time-outline',             iconColor: '#FFA040' },
  paid:            { variant: 'success', label: 'Paid',    icon: 'checkmark-circle-outline',  iconColor: '#4ADE80' },
  partially_paid:  { variant: 'warning', label: 'Partial', icon: 'ellipse-outline',           iconColor: '#FFA040' },
};

function fmt(n: number) { return '₦' + n.toLocaleString('en-NG'); }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PaymentsScreen() {
  const { theme }                   = useTheme();
  const insets                      = useSafeAreaInsets();
  const [schedule, setSchedule]     = useState<PaymentScheduleItem[]>([]);
  const [tenancyId, setTenancyId]   = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const tenancies = await tenanciesService.getTenantTenancies();
      const active    = tenancies.find(t => t.status === 'active');
      if (active) {
        setTenancyId(active.id);
        const items = await paymentsService.getSchedule(active.id);
        setSchedule(Array.isArray(items) ? items : []);
      } else {
        setSchedule([]);
      }
    } catch {
      setError('Could not load payment schedule.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const overdue  = schedule.filter(s => s.status === 'overdue');
  const pending  = schedule.filter(s => s.status === 'pending');
  const paid     = schedule.filter(s => s.status === 'paid');
  const totalOwed = [...overdue, ...pending].reduce((sum, p) => sum + p.amount, 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
    >
      {/* Balance Banner */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <LinearGradient colors={theme.primaryGrad} style={styles.banner}>
          <Text style={[typography.small, { color: 'rgba(255,255,255,0.75)' }]}>Total Outstanding</Text>
          <Text style={[typography.price, { color: '#fff', marginTop: 4 }]}>{fmt(totalOwed)}</Text>
          <View style={styles.bannerRow}>
            <View style={styles.bannerStat}>
              <Text style={[typography.caption, { color: 'rgba(255,255,255,0.7)' }]}>Overdue</Text>
              <Text style={[typography.bodyMed, { color: '#FF6B6B' }]}>{overdue.length}</Text>
            </View>
            <View style={styles.bannerDivider} />
            <View style={styles.bannerStat}>
              <Text style={[typography.caption, { color: 'rgba(255,255,255,0.7)' }]}>Upcoming</Text>
              <Text style={[typography.bodyMed, { color: '#fff' }]}>{pending.length}</Text>
            </View>
            <View style={styles.bannerDivider} />
            <View style={styles.bannerStat}>
              <Text style={[typography.caption, { color: 'rgba(255,255,255,0.7)' }]}>Paid</Text>
              <Text style={[typography.bodyMed, { color: '#4ADE80' }]}>{paid.length}</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.empty}>
          <Ionicons name="cloud-offline-outline" size={40} color={theme.textMuted} />
          <Text style={[typography.body, { color: theme.textMuted, marginTop: 10 }]}>{error}</Text>
        </View>
      ) : schedule.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={48} color={theme.textMuted} />
          <Text style={[typography.bodyMed, { color: theme.textPrimary, marginTop: 16 }]}>No payments yet</Text>
          <Text style={[typography.small, { color: theme.textMuted, marginTop: 6, textAlign: 'center' }]}>
            Your payment schedule will appear here once you have an active tenancy.
          </Text>
        </View>
      ) : (
        <>
          {overdue.length > 0 && (
            <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Ionicons name="alert-circle" size={14} color={theme.danger} />
                <Text style={[typography.label, { color: theme.danger }]}>OVERDUE PAYMENTS</Text>
              </View>
              {overdue.map(item => (
                <PaymentRow key={item.id} item={item} tenancyId={tenancyId!} theme={theme} />
              ))}
            </Animated.View>
          )}

          {pending.length > 0 && (
            <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.section}>
              <Text style={[typography.label, { color: theme.textMuted, marginBottom: 10 }]}>UPCOMING PAYMENTS</Text>
              {pending.map(item => (
                <PaymentRow key={item.id} item={item} tenancyId={tenancyId!} theme={theme} />
              ))}
            </Animated.View>
          )}

          {paid.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
              <Text style={[typography.label, { color: theme.textMuted, marginBottom: 10 }]}>PAYMENT HISTORY</Text>
              {paid.map(item => (
                <PaymentRow key={item.id} item={item} tenancyId={tenancyId!} theme={theme} />
              ))}
            </Animated.View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function PaymentRow({ item, tenancyId, theme }: { item: PaymentScheduleItem; tenancyId: string; theme: any }) {
  const cfg    = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
  const isPaid = item.status === 'paid';
  const label  = new Date(item.due_date).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });

  return (
    <Pressable
      onPress={() => !isPaid && router.push({
        pathname: '/(tenant)/payments/pay',
        params: { scheduleId: item.id, tenancyId, amount: item.amount, label },
      })}
      style={({ pressed }) => [styles.row, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: theme.background }]}>
        <Ionicons name={cfg.icon} size={22} color={cfg.iconColor} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>{label}</Text>
        <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>
          Due: {fmtDate(item.due_date)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Text style={[typography.bodyMed, { color: isPaid ? theme.success : theme.textPrimary }]}>
          {fmt(item.amount)}
        </Text>
        <Badge label={cfg.label} variant={cfg.variant} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container:     { padding: 20 },
  banner:        { borderRadius: 20, padding: 20, marginBottom: 24 },
  bannerRow:     { flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
  bannerStat:    { flex: 1, alignItems: 'center' },
  bannerDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  section:       { marginBottom: 24 },
  empty:         { alignItems: 'center', paddingTop: 40, paddingHorizontal: 40 },
  row:           { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginBottom: 10 },
  rowIcon:       { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
