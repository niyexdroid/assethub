import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { typography } from '../../../constants/typography';
import { complaintsService, Complaint } from '../../../services/complaints.service';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const FILTER_TABS = ['All', 'Open', 'In Progress', 'Resolved'];

const STATUS_CONFIG: Record<string, { variant: 'danger' | 'warning' | 'success' | 'info'; label: string }> = {
  open:        { variant: 'danger',  label: 'Open'        },
  in_progress: { variant: 'warning', label: 'In Progress' },
  resolved:    { variant: 'success', label: 'Resolved'    },
  escalated:   { variant: 'info',    label: 'Escalated'   },
  closed:      { variant: 'success', label: 'Closed'      },
};

const PRIORITY_COLORS: Record<string, string> = {
  high: '#FF6B6B', medium: '#FFA040', low: '#4ADE80', urgent: '#EF4444',
};

const CATEGORY_ICONS: Record<string, IoniconsName> = {
  Maintenance: 'construct-outline',
  Plumbing:    'water-outline',
  Noise:       'volume-high-outline',
  Security:    'shield-checkmark-outline',
  Cleaning:    'sparkles-outline',
  Electricity: 'flash-outline',
  Other:       'chatbubble-outline',
};

function filterByTab(complaints: Complaint[], tab: string) {
  if (tab === 'All')         return complaints;
  if (tab === 'Open')        return complaints.filter(c => c.status === 'open');
  if (tab === 'In Progress') return complaints.filter(c => c.status === 'in_progress' || c.status === 'escalated');
  if (tab === 'Resolved')    return complaints.filter(c => c.status === 'resolved' || c.status === 'closed');
  return complaints;
}

export default function ComplaintsScreen() {
  const { theme }                   = useTheme();
  const insets                      = useSafeAreaInsets();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [activeTab, setActiveTab]   = useState('All');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await complaintsService.list();
      setComplaints(Array.isArray(data) ? data : []);
    } catch { /* silently fail — show empty state */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filterByTab(complaints, activeTab);
  const openCount = complaints.filter(c => c.status === 'open').length;

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
          <Text style={[typography.h2, { color: theme.textPrimary }]}>Complaints</Text>
          <Text style={[typography.small, { color: theme.textMuted }]}>
            {loading ? '...' : `${openCount} open issue${openCount !== 1 ? 's' : ''}`}
          </Text>
        </View>
        <Button title="+ New" onPress={() => router.push('/(tenant)/complaints/new')} size="sm" />
      </Animated.View>

      {/* Stats row */}
      <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.statsRow}>
        {[
          { label: 'Open',     count: complaints.filter(c => c.status === 'open').length,        color: theme.danger  },
          { label: 'Progress', count: complaints.filter(c => c.status === 'in_progress').length, color: theme.warning },
          { label: 'Resolved', count: complaints.filter(c => c.status === 'resolved').length,    color: theme.success },
        ].map(stat => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[typography.h2, { color: stat.color }]}>{stat.count}</Text>
            <Text style={[typography.caption, { color: theme.textMuted }]}>{stat.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Filter tabs */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.tabsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {FILTER_TABS.map(tab => (
            <Pressable key={tab} onPress={() => setActiveTab(tab)}
              style={[styles.tab, {
                backgroundColor: activeTab === tab ? theme.primary : theme.surface,
                borderColor:     activeTab === tab ? theme.primary : theme.border,
              }]}>
              <Text style={[typography.small, {
                color: activeTab === tab ? '#fff' : theme.textSecondary,
                fontWeight: activeTab === tab ? '700' : '400',
              }]}>{tab}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      {/* List */}
      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
      ) : (
        <Animated.View entering={FadeInDown.delay(140).springify()} style={{ gap: 12 }}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={52} color={theme.success} />
              <Text style={[typography.bodyMed, { color: theme.textPrimary, marginTop: 12 }]}>
                {complaints.length === 0 ? 'No complaints yet' : 'No issues here!'}
              </Text>
              <Text style={[typography.small, { color: theme.textMuted, marginTop: 4, textAlign: 'center' }]}>
                {complaints.length === 0
                  ? 'Tap "+ New" to report an issue to your landlord.'
                  : 'All complaints in this category are clear.'}
              </Text>
            </View>
          ) : (
            filtered.map(complaint => {
              const cfg = STATUS_CONFIG[complaint.status] ?? STATUS_CONFIG.open;
              const catIcon = CATEGORY_ICONS[complaint.category] ?? 'chatbubble-outline';
              return (
                <Pressable
                  key={complaint.id}
                  onPress={() => router.push({ pathname: '/(tenant)/complaints/[id]', params: { id: complaint.id } })}
                  style={({ pressed }) => [styles.card, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.85 : 1 }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.categoryIcon, { backgroundColor: theme.background }]}>
                      <Ionicons name={catIcon} size={20} color={theme.textSecondary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[typography.bodyMed, { color: theme.textPrimary }]} numberOfLines={1}>
                        {complaint.title}
                      </Text>
                      <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>
                        {complaint.property_title ?? complaint.category}
                      </Text>
                    </View>
                    <Badge label={cfg.label} variant={cfg.variant} />
                  </View>
                  <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                    <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[complaint.priority] ?? '#888' }]} />
                    <Text style={[typography.caption, { color: theme.textMuted }]}>{complaint.priority} priority</Text>
                    <View style={styles.dot} />
                    <Text style={[typography.caption, { color: theme.textMuted }]}>
                      {new Date(complaint.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { padding: 20 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  statsRow:     { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard:     { flex: 1, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 12, alignItems: 'center' },
  tabsRow:      { marginBottom: 16 },
  tab:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  empty:        { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 40 },
  card:         { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', padding: 14 },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardFooter:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  priorityDot:  { width: 7, height: 7, borderRadius: 4 },
  dot:          { width: 3, height: 3, borderRadius: 2, backgroundColor: '#888', marginHorizontal: 2 },
});
