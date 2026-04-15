import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { Button } from '../../../components/ui/Button';
import { typography } from '../../../constants/typography';
import { roommatesService, RoommateMatch } from '../../../services/roommates.service';
import { tenanciesService } from '../../../services/tenancies.service';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TRAITS: { key: string; icon: IoniconsName }[] = [
  { key: 'sleep_schedule', icon: 'moon-outline' },
  { key: 'cleanliness',    icon: 'sparkles-outline' },
  { key: 'noise_level',    icon: 'volume-medium-outline' },
];

function ScoreRing({ score, size = 52, theme }: { score: number; size?: number; theme: any }) {
  const color = score >= 85 ? theme.success : score >= 70 ? theme.warning : theme.danger;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center',
      borderRadius: size / 2, borderWidth: 3, borderColor: color }}>
      <Text style={[typography.bodyMed, { color, fontSize: 14 }]}>{score}%</Text>
    </View>
  );
}

export default function RoommatesScreen() {
  const { theme }               = useTheme();
  const insets                  = useSafeAreaInsets();
  const [matches, setMatches]   = useState<RoommateMatch[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [sending, setSending]   = useState<string | null>(null);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [tenancies, received] = await Promise.allSettled([
        tenanciesService.getTenantTenancies(),
        roommatesService.getReceivedRequests(),
      ]);

      let propId = propertyId;
      if (tenancies.status === 'fulfilled') {
        const active = tenancies.value.find(t => t.status === 'active');
        if (active) { propId = active.property_id; setPropertyId(active.property_id); }
      }
      if (received.status === 'fulfilled') {
        setPendingCount(received.value.filter(r => r.status === 'pending').length);
      }

      if (propId) {
        const data = await roommatesService.getMatches(propId);
        setMatches(Array.isArray(data) ? data : []);
      }
    } catch { /* show empty */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [propertyId]);

  useEffect(() => { load(); }, []);

  const sendRequest = async (recipientId: string) => {
    if (!propertyId) return;
    setSending(recipientId);
    try {
      await roommatesService.sendRequest({ recipient_id: recipientId, property_id: propertyId });
    } catch { /* ignore duplicate */ }
    finally { setSending(null); }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
        <View>
          <Text style={[typography.h2, { color: theme.textPrimary }]}>Roommates</Text>
          <Text style={[typography.small, { color: theme.textMuted }]}>
            {loading ? '...' : `${matches.length} matches near you`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => router.push('/(tenant)/roommates/requests')}
            style={[styles.notifBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Ionicons name="notifications-outline" size={20} color={theme.textSecondary} />
            {pendingCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.danger }]}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{pendingCount}</Text>
              </View>
            )}
          </Pressable>
          <Button title="My Profile" onPress={() => router.push('/(tenant)/roommates/profile')} size="sm" variant="outline" />
        </View>
      </Animated.View>

      {/* Setup CTA */}
      <Animated.View entering={FadeInDown.delay(60).springify()}>
        <LinearGradient colors={theme.primaryGrad} style={styles.setupCard}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyMed, { color: '#fff' }]}>Complete your profile</Text>
            <Text style={[typography.small, { color: 'rgba(255,255,255,0.75)', marginTop: 2 }]}>
              Get better matches with a full profile
            </Text>
          </View>
          <Button title="Update" onPress={() => router.push('/(tenant)/roommates/profile')} variant="secondary" size="sm" />
        </LinearGradient>
      </Animated.View>

      {/* Legend */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.legendRow}>
        {[{ color: theme.success, label: '85%+ Great' }, { color: theme.warning, label: '70%+ Good' }, { color: theme.danger, label: '<70% Fair' }].map(l => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.color }]} />
            <Text style={[typography.caption, { color: theme.textMuted }]}>{l.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Matches */}
      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
      ) : matches.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={52} color={theme.textMuted} />
          <Text style={[typography.bodyMed, { color: theme.textPrimary, marginTop: 16 }]}>No matches yet</Text>
          <Text style={[typography.small, { color: theme.textMuted, marginTop: 6, textAlign: 'center' }]}>
            {!propertyId
              ? 'You need an active tenancy to see roommate matches.'
              : 'No other tenants have set up roommate profiles for this property yet.'}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {matches.map((match, i) => {
            const profile  = match.profile;
            const tenant   = profile.tenant;
            const lifestyle = profile.lifestyle ?? [];
            return (
              <Animated.View key={match.id ?? i} entering={FadeInRight.delay(i * 60).springify()}>
                <Pressable style={({ pressed }) => [styles.card, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.85 : 1 }]}>
                  <View style={styles.cardTop}>
                    <View style={[styles.avatar, { backgroundColor: theme.background }]}>
                      <Ionicons name="person-circle-outline" size={36} color={theme.textMuted} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>
                        {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Tenant'}
                      </Text>
                      <Text style={[typography.small, { color: theme.textMuted, marginTop: 2 }]}>
                        Budget: ₦{profile.budget_min?.toLocaleString('en-NG') ?? '—'} – ₦{profile.budget_max?.toLocaleString('en-NG') ?? '—'}/mo
                      </Text>
                      <Text style={[typography.small, { color: theme.textMuted }]}>
                        {profile.gender_preference ? `Prefers: ${profile.gender_preference}` : ''}
                      </Text>
                    </View>
                    <ScoreRing score={Math.round(match.score ?? 0)} theme={theme} />
                  </View>

                  {/* Lifestyle traits */}
                  {lifestyle.length > 0 && (
                    <View style={styles.traitsRow}>
                      {lifestyle.slice(0, 3).map((trait: string) => (
                        <View key={trait} style={[styles.trait, { backgroundColor: theme.background }]}>
                          <Text style={[typography.caption, { color: theme.textSecondary }]}>{trait}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Actions */}
                  <View style={[styles.cardActions, { borderTopColor: theme.border }]}>
                    <Button title="Send Request"
                      onPress={() => sendRequest(profile.tenant_id)}
                      loading={sending === profile.tenant_id}
                      size="sm" />
                  </View>
                </Pressable>
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
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  notifBtn:    { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  badge:       { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  setupCard:   { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 16, gap: 12 },
  legendRow:   { flexDirection: 'row', gap: 16, marginBottom: 16 },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  card:        { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  cardTop:     { flexDirection: 'row', alignItems: 'center', padding: 14 },
  avatar:      { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  traitsRow:   { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 12, flexWrap: 'wrap' },
  trait:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
  empty:       { alignItems: 'center', paddingTop: 40, paddingHorizontal: 40 },
});
