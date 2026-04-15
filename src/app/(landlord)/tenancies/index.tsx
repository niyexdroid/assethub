import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { Badge }  from '../../../components/ui/Badge';
import { typography } from '../../../constants/typography';
import { tenanciesService, Tenancy } from '../../../services/tenancies.service';

const FILTER_TABS = ['All', 'Active', 'Pending', 'Terminated'];

export default function TenanciesScreen() {
  const { theme }                   = useTheme();
  const insets                      = useSafeAreaInsets();
  const [tenancies, setTenancies]   = useState<Tenancy[]>([]);
  const [filter, setFilter]         = useState('All');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await tenanciesService.getLandlordTenancies();
      setTenancies(Array.isArray(data) ? data : []);
    } catch { /* show empty */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'All' ? tenancies
    : tenancies.filter(t => t.status === filter.toLowerCase());

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
    >
      <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
        <Text style={[typography.h2, { color: theme.textPrimary }]}>Tenancies</Text>
        <Text style={[typography.small, { color: theme.textMuted }]}>
          {loading ? '...' : `${tenancies.filter(t => t.status === 'active').length} active`}
        </Text>
      </Animated.View>

      {/* Filter */}
      <Animated.View entering={FadeInDown.delay(60).springify()} style={{ flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTER_TABS.map(tab => (
          <Pressable key={tab} onPress={() => setFilter(tab)}
            style={[styles.filterTab, { backgroundColor: filter === tab ? theme.primary : theme.surface, borderColor: filter === tab ? theme.primary : theme.border }]}>
            <Text style={[typography.small, { color: filter === tab ? '#fff' : theme.textSecondary, fontWeight: filter === tab ? '700' : '400' }]}>{tab}</Text>
          </Pressable>
        ))}
      </Animated.View>

      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={52} color={theme.textMuted} />
          <Text style={[typography.bodyMed, { color: theme.textPrimary, marginTop: 16 }]}>No tenancies</Text>
          <Text style={[typography.small, { color: theme.textMuted, marginTop: 6, textAlign: 'center' }]}>
            Create a tenancy from a property listing to get started.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {filtered.map((t, i) => {
            const statusVariant = t.status === 'active' ? 'success' : t.status === 'pending' ? 'warning' : 'info';
            return (
              <Animated.View key={t.id} entering={FadeInDown.delay(100 + i * 50).springify()}>
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={styles.cardTop}>
                    <View style={[styles.avatar, { backgroundColor: theme.surfaceRaised }]}>
                      <Ionicons name="person-outline" size={22} color={theme.textSecondary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>
                        {t.tenant ? `${t.tenant.first_name} ${t.tenant.last_name}` : 'Tenant'}
                      </Text>
                      <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>
                        {t.property?.title ?? t.property_id}
                      </Text>
                      <Text style={[typography.small, { color: theme.primaryLight, fontWeight: '600', marginTop: 2 }]}>
                        ₦{t.monthly_rent.toLocaleString('en-NG')}/mo
                      </Text>
                    </View>
                    <Badge label={t.status} variant={statusVariant} dot />
                  </View>
                  <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="calendar-outline" size={12} color={theme.textMuted} />
                      <Text style={[typography.caption, { color: theme.textMuted }]}>
                        {formatDate(t.start_date)} – {formatDate(t.end_date)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name={t.tenant_signed_at ? 'checkmark-circle-outline' : 'ellipse-outline'} size={12}
                        color={t.tenant_signed_at ? theme.success : theme.textMuted} />
                      <Text style={[typography.caption, { color: theme.textMuted }]}>
                        {t.tenant_signed_at ? 'Signed' : 'Unsigned'}
                      </Text>
                    </View>
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
  container:  { padding: 20 },
  header:     { marginBottom: 20 },
  filterTab:  { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  card:       { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  cardTop:    { flexDirection: 'row', alignItems: 'center', padding: 14 },
  avatar:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  empty:      { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
});
