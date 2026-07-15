import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { typography } from '../../../constants/typography';
import { tenanciesService, Tenancy } from '../../../services/tenancies.service';
import { paymentsService, PaymentTransaction } from '../../../services/payments.service';
import { formatNGN } from '../../../utils/format';

const STATUS_BADGE: Record<string, { variant: 'danger' | 'warning' | 'success' | 'info'; label: string }> = {
  active:     { variant: 'success', label: 'Active'     },
  pending:    { variant: 'warning', label: 'Pending'    },
  terminated: { variant: 'info',    label: 'Terminated' },
  declined:   { variant: 'danger',  label: 'Declined'   },
};

const TX_STATUS: Record<string, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
  success: { variant: 'success', label: 'Success' },
  pending: { variant: 'warning', label: 'Pending' },
  failed:  { variant: 'danger',  label: 'Failed'  },
};

export default function TenantTenancyDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tenancy, setTenancy] = useState<Tenancy | null>(null);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [terminating, setTerminating] = useState(false);
  const [signing, setSigning] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [t, p] = await Promise.all([
        tenanciesService.getById(id),
        paymentsService.getHistory() as Promise<PaymentTransaction[]>,
      ]);
      setTenancy(t);
      setPayments((p as unknown as PaymentTransaction[]).filter((tx) => tx.tenancy_id === id));
    } catch {
      setError('Could not load tenancy details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleTerminate = () => {
    Alert.alert(
      'Terminate Tenancy',
      'This action cannot be undone. The landlord will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            setTerminating(true);
            try {
              await tenanciesService.terminate(id, 'Terminated by tenant');
              setTenancy(prev => prev ? { ...prev, status: 'terminated' as const } : prev);
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message ?? 'Failed to terminate tenancy.');
            } finally {
              setTerminating(false);
            }
          },
        },
      ],
    );
  };

  const handleSign = async () => {
    if (!id) return;
    setSigning(true);
    try {
      await tenanciesService.signAsTenant(id);
      setTenancy(prev => prev ? { ...prev, tenant_signed_at: new Date().toISOString() } : prev);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to sign agreement.');
    } finally {
      setSigning(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error || !tenancy) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
        <Text style={[typography.bodyMed, { color: theme.textPrimary, marginTop: 12 }]}>{error || 'Tenancy not found.'}</Text>
        <Pressable onPress={load} style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.primary }}>
          <Text style={[typography.label, { color: theme.primary }]}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const statusBadge = STATUS_BADGE[tenancy.status] ?? STATUS_BADGE.pending;
  const isActive = tenancy.status === 'active';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        <Ionicons name="chevron-back" size={20} color={theme.primaryLight} />
        <Text style={[typography.label, { color: theme.primaryLight }]}>Tenancy</Text>
      </Pressable>

      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={[typography.h3, { color: theme.textPrimary, flex: 1 }]}>Tenancy Details</Text>
        <Badge label={statusBadge.label} variant={statusBadge.variant} />
      </View>

      {/* Property Card */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 20 }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="home-outline" size={18} color={theme.textMuted} />
          <Text style={[typography.label, { color: theme.textMuted }]}>PROPERTY</Text>
        </View>
        {tenancy.property_title ? (
          <View style={{ marginTop: 8 }}>
            <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>{tenancy.property_title}</Text>
            <Text style={[typography.small, { color: theme.textMuted, marginTop: 2 }]}>{tenancy.property_address ?? tenancy.address}</Text>
          </View>
        ) : (
          <Text style={[typography.small, { color: theme.textMuted, marginTop: 8 }]}>—</Text>
        )}
      </View>

      {/* Landlord Card */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="person-outline" size={18} color={theme.textMuted} />
          <Text style={[typography.label, { color: theme.textMuted }]}>LANDLORD</Text>
        </View>
        <Text style={[typography.small, { color: theme.textMuted, marginTop: 8 }]}>
          Contact your landlord through the property listing or use the complaints system for urgent issues.
        </Text>
      </View>

      {/* Rent & Dates Card */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="cash-outline" size={18} color={theme.textMuted} />
          <Text style={[typography.label, { color: theme.textMuted }]}>RENT & DATES</Text>
        </View>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={[typography.caption, { color: theme.textMuted }]}>Rent Amount</Text>
            <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>{formatNGN(tenancy.monthly_amount ?? tenancy.yearly_amount ?? 0)}/mo</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={[typography.caption, { color: theme.textMuted }]}>Type</Text>
            <Text style={[typography.bodyMed, { color: theme.textPrimary, textTransform: 'capitalize' }]}>
              {tenancy.tenancy_type || '—'}
            </Text>
          </View>
          {tenancy.caution_fee_paid != null && (
            <View style={styles.gridItem}>
              <Text style={[typography.caption, { color: theme.textMuted }]}>Caution Fee</Text>
              <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>{formatNGN(tenancy.caution_fee_paid)}</Text>
            </View>
          )}
          {tenancy.agency_fee_paid != null && (
            <View style={styles.gridItem}>
              <Text style={[typography.caption, { color: theme.textMuted }]}>Agency Fee</Text>
              <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>{formatNGN(tenancy.agency_fee_paid)}</Text>
            </View>
          )}
        </View>
        <View style={[styles.divider, { borderColor: theme.border }]} />
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={[typography.caption, { color: theme.textMuted }]}>Start Date</Text>
            <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>
              {tenancy.start_date ? formatDate(tenancy.start_date) : '—'}
            </Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={[typography.caption, { color: theme.textMuted }]}>End Date</Text>
            <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>
              {tenancy.end_date ? formatDate(tenancy.end_date) : '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* Agreement Card */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="document-text-outline" size={18} color={theme.textMuted} />
          <Text style={[typography.label, { color: theme.textMuted }]}>AGREEMENT</Text>
        </View>
        <View style={{ marginTop: 8, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.dot, { backgroundColor: tenancy.tenant_signed_at ? theme.success : theme.textMuted }]} />
            <Text style={[typography.small, { color: theme.textSecondary }]}>
              You {tenancy.tenant_signed_at ? 'signed' : 'not signed'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.dot, { backgroundColor: tenancy.landlord_signed_at ? theme.success : theme.textMuted }]} />
            <Text style={[typography.small, { color: theme.textSecondary }]}>
              Landlord {tenancy.landlord_signed_at ? 'signed' : 'not signed'}
            </Text>
          </View>
          {isActive && !tenancy.tenant_signed_at && (
            <Button title="Sign Agreement" onPress={handleSign} size="sm" loading={signing} style={{ marginTop: 6 }} />
          )}
        </View>
      </View>

      {/* Payment History */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="receipt-outline" size={18} color={theme.textMuted} />
          <Text style={[typography.label, { color: theme.textMuted }]}>PAYMENT HISTORY</Text>
        </View>
        {payments.length === 0 ? (
          <Text style={[typography.small, { color: theme.textMuted, marginTop: 8, textAlign: 'center', paddingVertical: 12 }]}>
            No payments recorded for this tenancy.
          </Text>
        ) : (
          <View style={{ marginTop: 8 }}>
            {payments.map((tx, i) => {
              const txBadge = TX_STATUS[tx.status] ?? TX_STATUS.pending;
              return (
                <View
                  key={tx.id}
                  style={[styles.txRow, i < payments.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.border }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>{formatNGN(tx.amount)}</Text>
                    <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>
                      {tx.reference?.slice(0, 16)}... • {formatDate(tx.paid_at)}
                    </Text>
                  </View>
                  <Badge label={txBadge.label} variant={txBadge.variant} />
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Created */}
      <Text style={[typography.caption, { color: theme.textMuted, marginTop: 8, textAlign: 'center' }]}>
        Created {formatDate(tenancy.created_at)}
      </Text>

      {/* Actions */}
      <View style={{ gap: 10, marginTop: 20 }}>
        {isActive && (
          <Button title="Terminate Tenancy" onPress={handleTerminate} variant="outline" size="lg" loading={terminating} />
        )}
        <Button title="Back" onPress={() => router.back()} variant="ghost" size="lg" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card:       { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  gridItem:   { width: '50%', marginTop: 10 },
  divider:    { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 14 },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  txRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
});
