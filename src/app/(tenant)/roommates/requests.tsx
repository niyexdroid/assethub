import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { typography } from '../../../constants/typography';
import { roommatesService, RoommateRequest } from '../../../services/roommates.service';

const STATUS_BADGE: Record<string, { variant: 'warning' | 'success' | 'danger'; label: string }> = {
  pending:  { variant: 'warning', label: 'Pending'  },
  accepted: { variant: 'success', label: 'Accepted' },
  declined: { variant: 'danger',  label: 'Declined' },
};

export default function RoommateRequestsScreen() {
  const { theme }                       = useTheme();
  const insets                          = useSafeAreaInsets();
  const [received, setReceived]         = useState<RoommateRequest[]>([]);
  const [sent, setSent]                 = useState<RoommateRequest[]>([]);
  const [activeTab, setActiveTab]       = useState<'incoming' | 'outgoing'>('incoming');
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [responding, setResponding]     = useState<string | null>(null);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [recv, snt] = await Promise.allSettled([
        roommatesService.getReceivedRequests(),
        roommatesService.getSentRequests(),
      ]);
      if (recv.status === 'fulfilled') setReceived(recv.value);
      if (snt.status  === 'fulfilled') setSent(snt.value);
    } catch { /* show empty */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const respond = async (id: string, action: 'accept' | 'decline') => {
    setResponding(id);
    try {
      if (action === 'accept') await roommatesService.acceptRequest(id);
      else await roommatesService.declineRequest(id);
      load();
    } finally { setResponding(null); }
  };

  const visible = activeTab === 'incoming' ? received : sent;
  const pendingIncoming = received.filter(r => r.status === 'pending').length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
        <Text style={[typography.h2, { color: theme.textPrimary }]}>Roommate Requests</Text>
        <Text style={[typography.small, { color: theme.textMuted }]}>
          {pendingIncoming} pending incoming
        </Text>
      </Animated.View>

      {/* Tabs */}
      <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.tabs}>
        {(['incoming', 'outgoing'] as const).map(tab => {
          const count = tab === 'incoming' ? pendingIncoming : sent.filter(r => r.status === 'pending').length;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, {
                backgroundColor: activeTab === tab ? theme.primary : theme.surface,
                borderColor:     activeTab === tab ? theme.primary : theme.border,
                flex: 1,
              }]}
            >
              <Text style={[typography.bodyMed, { color: activeTab === tab ? '#fff' : theme.textSecondary, textTransform: 'capitalize' }]}>
                {tab}
              </Text>
              {count > 0 && (
                <View style={[styles.countBadge, { backgroundColor: activeTab === tab ? 'rgba(255,255,255,0.3)' : theme.danger }]}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{count}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </Animated.View>

      {/* List */}
      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
      ) : visible.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            name={activeTab === 'incoming' ? 'mail-outline' : 'send-outline'}
            size={52}
            color={theme.textMuted}
          />
          <Text style={[typography.bodyMed, { color: theme.textPrimary, marginTop: 12 }]}>
            {activeTab === 'incoming' ? 'No incoming requests' : 'No outgoing requests'}
          </Text>
          <Text style={[typography.small, { color: theme.textMuted, marginTop: 4, textAlign: 'center' }]}>
            {activeTab === 'incoming'
              ? "When someone sends you a roommate request, it'll appear here."
              : 'Browse matches and send roommate requests.'}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {visible.map((req, i) => {
            const badgeCfg  = STATUS_BADGE[req.status] ?? STATUS_BADGE.pending;
            const isPending = req.status === 'pending';
            const person    = activeTab === 'incoming' ? req.requester : undefined;
            return (
              <Animated.View key={req.id} entering={FadeInRight.delay(i * 60).springify()}>
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={styles.cardTop}>
                    <View style={[styles.avatar, { backgroundColor: theme.background }]}>
                      <Ionicons name="person-circle-outline" size={34} color={theme.textMuted} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>
                        {person ? `${person.first_name} ${person.last_name}` : 'Tenant'}
                      </Text>
                      <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>
                        {req.property?.title ?? 'Property'}
                      </Text>
                      {req.message && (
                        <Text style={[typography.small, { color: theme.textMuted, marginTop: 2 }]} numberOfLines={1}>
                          "{req.message}"
                        </Text>
                      )}
                    </View>
                    <Badge label={badgeCfg.label} variant={badgeCfg.variant} />
                  </View>

                  <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                      <Ionicons name="time-outline" size={13} color={theme.textMuted} />
                      <Text style={[typography.caption, { color: theme.textMuted }]}>
                        {new Date(req.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                    {activeTab === 'incoming' && isPending && (
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Button title="Decline"
                          onPress={() => respond(req.id, 'decline')}
                          loading={responding === req.id}
                          variant="danger" size="sm" />
                        <Button title="Accept"
                          onPress={() => respond(req.id, 'accept')}
                          loading={responding === req.id}
                          size="sm" />
                      </View>
                    )}
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
  header:      { marginBottom: 16 },
  tabs:        { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tab:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 12 },
  countBadge:  { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  empty:       { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 40 },
  card:        { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  cardTop:     { flexDirection: 'row', alignItems: 'center', padding: 14 },
  avatar:      { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  cardFooter:  { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
