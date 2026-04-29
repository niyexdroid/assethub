import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';
import { typography } from '../../../constants/typography';
import { tenanciesService, Tenancy } from '../../../services/tenancies.service';
import { formatNGN } from '../../../utils/format';

const STATUS_COLOR: Record<string, string> = {
  active:     '#12A376',
  pending:    '#F59E0B',
  terminated: '#EF4444',
  declined:   '#6B7280',
};

const STATUS_ICON: Record<string, string> = {
  active:     'checkmark-circle',
  pending:    'time',
  terminated: 'close-circle',
  declined:   'ban',
};

export default function TenancyScreen() {
  const { theme }                   = useTheme();
  const insets                      = useSafeAreaInsets();
  const [tenancies, setTenancies]   = useState<Tenancy[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const data = await tenanciesService.getTenantTenancies();
      setTenancies(data);
    } catch {
      setError('Could not load tenancies.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatNaira = (n: number) =>
    formatNGN(n);

  const activeTenancy = tenancies.find(t => t.status === 'active');
  const others        = tenancies.filter(t => t.status !== 'active');

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Text style={[typography.h2, { color: theme.textPrimary }]}>My Tenancy</Text>
        <Text style={[typography.body, { color: theme.textMuted, marginTop: 2 }]}>Lease agreements and rent info</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
          <Text style={[typography.bodyMed, { color: theme.textPrimary, marginTop: 12 }]}>Connection error</Text>
          <Pressable onPress={() => load()} style={[styles.retryBtn, { borderColor: theme.primary }]}>
            <Text style={[typography.label, { color: theme.primary }]}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
        >
          {tenancies.length === 0 ? (
            <Animated.View entering={FadeInDown.springify()} style={styles.empty}>
              <Ionicons name="document-text-outline" size={56} color={theme.textMuted} />
              <Text style={[typography.bodyMed, { color: theme.textPrimary, marginTop: 16 }]}>No tenancy yet</Text>
              <Text style={[typography.small, { color: theme.textMuted, marginTop: 6, textAlign: 'center' }]}>
                Your landlord will send you a tenancy agreement once you're linked to a property.
              </Text>
            </Animated.View>
          ) : (
            <>
              {/* Active tenancy card */}
              {activeTenancy && (
                <Animated.View entering={FadeInDown.delay(0).springify()}>
                  <Text style={[typography.label, { color: theme.textMuted, marginBottom: 10 }]}>ACTIVE LEASE</Text>
                  <Pressable
                    onPress={() => router.push({ pathname: '/(tenant)/tenancy/[id]' as any, params: { id: activeTenancy.id } })}
                    style={[styles.activeCard, { backgroundColor: theme.primary }]}
                  >
                    <View style={styles.cardRow}>
                      <Text style={[typography.bodyMed, { color: '#fff' }]} numberOfLines={1}>
                        {activeTenancy.property?.title ?? 'Property'}
                      </Text>
                      <View style={styles.statusBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#fff" />
                        <Text style={[typography.small, { color: '#fff', marginLeft: 4 }]}>Active</Text>
                      </View>
                    </View>
                    <Text style={[typography.caption, { color: 'rgba(255,255,255,0.75)', marginTop: 4 }]}>
                      {activeTenancy.property?.address}
                    </Text>
                    <View style={[styles.cardDivider, { borderColor: 'rgba(255,255,255,0.2)' }]} />
                    <View style={styles.cardRow}>
                      <View>
                        <Text style={[typography.caption, { color: 'rgba(255,255,255,0.7)' }]}>Monthly Rent</Text>
                        <Text style={[typography.h3, { color: '#fff' }]}>{formatNaira(activeTenancy.monthly_rent)}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[typography.caption, { color: 'rgba(255,255,255,0.7)' }]}>Lease ends</Text>
                        <Text style={[typography.bodyMed, { color: '#fff' }]}>{formatDate(activeTenancy.end_date)}</Text>
                      </View>
                    </View>

                    {/* Signature status */}
                    <View style={[styles.sigRow, { borderColor: 'rgba(255,255,255,0.2)' }]}>
                      <SigBadge label="Your signature" signed={!!activeTenancy.tenant_signed_at} />
                      <SigBadge label="Landlord signature" signed={!!activeTenancy.landlord_signed_at} />
                    </View>

                    {/* Actions */}
                    {!activeTenancy.tenant_signed_at && (
                      <Pressable style={styles.signBtn} onPress={async () => {
                        await tenanciesService.signAsTenant(activeTenancy.id);
                        load();
                      }}>
                        <Text style={[typography.bodyMed, { color: theme.primary }]}>Sign Agreement</Text>
                      </Pressable>
                    )}
                  </Pressable>
                </Animated.View>
              )}

              {/* Pending tenancies */}
              {tenancies.filter(t => t.status === 'pending').map((t, i) => (
                <Animated.View key={t.id} entering={FadeInDown.delay((i + 1) * 80).springify()}>
                  <TenancyRow tenancy={t} theme={theme} formatDate={formatDate} formatNaira={formatNaira}
                    onPress={() => router.push({ pathname: '/(tenant)/tenancy/[id]' as any, params: { id: t.id } })}
                    onAccept={async () => { await tenanciesService.accept(t.id); load(); }}
                    onDecline={async () => { await tenanciesService.decline(t.id); load(); }}
                  />
                </Animated.View>
              ))}

              {/* Past tenancies */}
              {others.filter(t => t.status !== 'pending').length > 0 && (
                <Text style={[typography.label, { color: theme.textMuted, marginTop: 24, marginBottom: 10 }]}>PAST TENANCIES</Text>
              )}
              {others.filter(t => t.status !== 'pending').map((t, i) => (
                <Animated.View key={t.id} entering={FadeInDown.delay((i + 2) * 80).springify()}>
                  <TenancyRow tenancy={t} theme={theme} formatDate={formatDate} formatNaira={formatNaira}
                    onPress={() => router.push({ pathname: '/(tenant)/tenancy/[id]' as any, params: { id: t.id } })}
                  />
                </Animated.View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function SigBadge({ label, signed }: { label: string; signed: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={signed ? 'checkmark-circle' : 'ellipse-outline'} size={14}
        color={signed ? '#fff' : 'rgba(255,255,255,0.5)'} />
      <Text style={{ fontSize: 11, color: signed ? '#fff' : 'rgba(255,255,255,0.5)' }}>{label}</Text>
    </View>
  );
}

function TenancyRow({ tenancy, theme, formatDate, formatNaira, onPress, onAccept, onDecline }: any) {
  const color = STATUS_COLOR[tenancy.status] ?? '#6B7280';
  const icon  = STATUS_ICON[tenancy.status]  ?? 'ellipse';
  return (
    <Pressable onPress={onPress} style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardRow}>
        <Text style={[typography.bodyMed, { color: theme.textPrimary, flex: 1 }]} numberOfLines={1}>
          {tenancy.property?.title ?? 'Property'}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon as any} size={12} color={color} />
          <Text style={[typography.small, { color, marginLeft: 4, textTransform: 'capitalize' }]}>{tenancy.status}</Text>
        </View>
      </View>
      <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>{tenancy.property?.address}</Text>
      <Text style={[typography.caption, { color: theme.textMuted, marginTop: 4 }]}>
        {formatDate(tenancy.start_date)} — {formatDate(tenancy.end_date)} · {formatNaira(tenancy.monthly_rent)}/mo
      </Text>
      {tenancy.status === 'pending' && onAccept && (
        <View style={styles.actionRow}>
          <Pressable onPress={onAccept} style={[styles.actionBtn, { backgroundColor: '#12A37618', borderColor: '#12A376' }]}>
            <Text style={[typography.label, { color: '#12A376' }]}>Accept</Text>
          </Pressable>
          <Pressable onPress={onDecline} style={[styles.actionBtn, { backgroundColor: '#EF444418', borderColor: '#EF4444' }]}>
            <Text style={[typography.label, { color: '#EF4444' }]}>Decline</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header:      { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  scroll:      { padding: 20 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  empty:       { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  retryBtn:    { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  activeCard:  { borderRadius: 16, padding: 20, marginBottom: 24 },
  cardRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  cardDivider: { borderTopWidth: StyleSheet.hairlineWidth, marginVertical: 16 },
  sigRow:      { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, marginTop: 12 },
  signBtn:     { marginTop: 14, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  row:         { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  statusPill:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  actionRow:   { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn:   { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  h3:          { fontSize: 20, fontWeight: '700' },
});
