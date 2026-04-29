import React, { useCallback, useState } from 'react';
import { formatNGNCompact } from '../../utils/format';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Card }   from '../../components/ui/Card';
import { Badge }  from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { typography } from '../../constants/typography';
import { useAuthStore } from '../../store/auth.store';
import { propertiesService } from '../../services/properties.service';
import { tenanciesService, Tenancy } from '../../services/tenancies.service';
import { complaintsService } from '../../services/complaints.service';
import { paymentsService } from '../../services/payments.service';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function DashboardScreen() {
  const { theme }  = useTheme();
  const insets     = useSafeAreaInsets();
  const { user }   = useAuthStore();

  const [properties,  setProperties]  = useState<any[]>([]);
  const [tenancies,   setTenancies]   = useState<Tenancy[]>([]);
  const [complaints,  setComplaints]  = useState<any[]>([]);
  const [payments,    setPayments]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [loadError,   setLoadError]   = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    setLoadError(false);
    try {
      const [props, tens, comps, pays] = await Promise.allSettled([
        propertiesService.getLandlordProperties(),
        tenanciesService.getLandlordTenancies(),
        complaintsService.list(),
        paymentsService.getHistory(),
      ]);
      const anyFulfilled = [props, tens, comps, pays].some(r => r.status === 'fulfilled');
      if (!anyFulfilled) { setLoadError(true); return; }
      if (props.status  === 'fulfilled') setProperties(props.value);
      if (tens.status   === 'fulfilled') setTenancies(tens.value);
      if (comps.status  === 'fulfilled') setComplaints(comps.value);
      if (pays.status   === 'fulfilled') setPayments(Array.isArray(pays.value) ? pays.value : pays.value.data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const hasData = properties.length > 0 || tenancies.length > 0 || payments.length > 0;
  useFocusEffect(useCallback(() => { load(!hasData ? false : true); }, [load, hasData]));

  const activeTenancies = tenancies.filter(t => t.status === 'active');
  const pendingTenancies = tenancies.filter(t => t.status === 'pending');
  const openComplaints   = complaints.filter((c: any) => c.status === 'open' || c.status === 'in_progress');
  const thisMonthRevenue = payments
    .filter((p: any) => {
      const paid = new Date(p.paid_at ?? p.created_at);
      const now  = new Date();
      return paid.getMonth() === now.getMonth() && paid.getFullYear() === now.getFullYear();
    })
    .reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const STATS: { icon: IoniconsName; label: string; value: string; sub: string; color: string; glow: 'green' | 'gold' }[] = [
    { icon: 'home-outline',          label: 'Properties', value: String(properties.length),     sub: `${properties.filter(p => p.is_available).length} available`, color: '#12A376', glow: 'green' },
    { icon: 'people-outline',        label: 'Tenants',    value: String(activeTenancies.length), sub: `${pendingTenancies.length} pending`,                          color: '#F4A825', glow: 'gold'  },
    { icon: 'wallet-outline',        label: 'This Month', value: formatNGNCompact(thisMonthRevenue),          sub: `${payments.filter((p: any) => { const d = new Date(p.paid_at ?? p.created_at); const n = new Date(); return d.getMonth() === n.getMonth(); }).length} payments`, color: '#12A376', glow: 'green' },
    { icon: 'alert-circle-outline',  label: 'Complaints', value: String(openComplaints.length),  sub: 'Open',                                                        color: '#F4A825', glow: 'gold'  },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
    >
      {/* Greeting */}
      <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.greeting}>
        <View>
          <Text style={[typography.caption, { color: theme.textMuted }]}>{greeting()}</Text>
          <Text style={[typography.h2, { color: theme.textPrimary }]}>
            {user?.first_name ?? 'Landlord'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Pressable onPress={() => router.push('/(shared)/notifications')}
            style={[styles.avatar, { backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border }]}>
            <Ionicons name="notifications-outline" size={20} color={theme.textSecondary} />
          </Pressable>
          <Pressable onPress={() => router.push('/(shared)/settings')}>
            <View style={[styles.avatar, { backgroundColor: theme.primaryGrad[0] + '30' }]}>
              <Ionicons name="person-outline" size={22} color={theme.primary} />
            </View>
          </Pressable>
        </View>
      </Animated.View>

      {/* Revenue banner */}
      <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.bannerWrap}>
        <LinearGradient colors={theme.primaryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
          <View>
            <Text style={[typography.label, { color: 'rgba(255,255,255,0.7)' }]}>Total Revenue This Month</Text>
            <Text style={[typography.price, { color: '#fff', marginTop: 4 }]}>{formatNGNCompact(thisMonthRevenue)}</Text>
          </View>
          <View style={[styles.bannerIcon, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Ionicons name="trending-up" size={32} color="#fff" />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        {STATS.map((s, i) => (
          <Animated.View key={i} entering={FadeInDown.delay(80 + i * 40).springify()} style={styles.statWrap}>
            <Card style={styles.statCard} glow={s.glow}>
              <View style={[styles.statIconWrap, { backgroundColor: s.color + '18' }]}>
                <Ionicons name={s.icon} size={20} color={s.color} />
              </View>
              <Text style={[typography.h3, { color: s.color, marginTop: 10 }]}>{loading ? '...' : s.value}</Text>
              <Text style={[typography.caption, { color: theme.textPrimary, marginTop: 2 }]}>{s.label}</Text>
              <Text style={[typography.caption, { color: theme.textSecondary }]}>{loading ? '' : s.sub}</Text>
            </Card>
          </Animated.View>
        ))}
      </View>

      {/* Tenant status */}
      <Animated.View entering={FadeInDown.delay(280).springify()} style={{ marginTop: 16 }}>
        <View style={styles.sectionHeader}>
          <Text style={[typography.h4, { color: theme.textPrimary }]}>Tenant Status</Text>
          <Pressable onPress={() => router.push('/(landlord)/tenancies/')}>
            <Text style={[typography.label, { color: theme.primaryLight }]}>See all</Text>
          </Pressable>
        </View>

        {loadError ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[typography.body, { color: theme.textMuted, marginBottom: 12 }]}>Could not load data</Text>
            <Pressable onPress={() => load()}>
              <Text style={[typography.bodyMed, { color: theme.primaryLight }]}>Tap to retry</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <ActivityIndicator color={theme.primary} />
        ) : tenancies.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[typography.body, { color: theme.textMuted }]}>No tenants yet</Text>
          </View>
        ) : (
          tenancies.slice(0, 4).map((t, i) => (
            <Animated.View key={t.id} entering={FadeInRight.delay(300 + i * 60).springify()}>
              <Card onPress={() => {}} style={styles.tenantRow}>
                <View style={[styles.tenantAvatar, { backgroundColor: theme.surfaceRaised }]}>
                  <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>
                    {t.tenant ? `${t.tenant.first_name} ${t.tenant.last_name}` : 'Tenant'}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textMuted }]}>
                    {t.property?.title ?? t.property_id}
                  </Text>
                </View>
                <Badge
                  label={t.status === 'active' ? 'Active' : t.status === 'pending' ? 'Pending' : t.status}
                  variant={t.status === 'active' ? 'success' : t.status === 'pending' ? 'warning' : 'info'}
                  dot
                />
              </Card>
            </Animated.View>
          ))
        )}
      </Animated.View>

      {/* Quick actions */}
      <Animated.View entering={FadeInDown.delay(400).springify()} style={{ marginTop: 24 }}>
        <Text style={[typography.h4, { color: theme.textPrimary, marginBottom: 12 }]}>Quick Actions</Text>
        <View style={styles.actions}>
          <Button title="List Property" onPress={() => router.push('/(landlord)/listings/create')} size="md" style={{ flex: 1 }} />
          <Button title="Complaints"   onPress={() => router.push('/(landlord)/complaints/')} variant="outline" size="md" style={{ flex: 1 }} />
        </View>
      </Animated.View>

      <View style={{ height: 140 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:        { paddingHorizontal: 20 },
  greeting:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  avatar:        { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  bannerWrap:    { marginBottom: 20 },
  banner:        { borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerIcon:    { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  statWrap:      { width: '47%' },
  statCard:      { gap: 0 },
  statIconWrap:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tenantRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  tenantAvatar:  { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  emptyCard:     { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 20, alignItems: 'center' },
  actions:       { flexDirection: 'row', gap: 12 },
});
