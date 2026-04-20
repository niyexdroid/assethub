import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';
import { typography } from '../../constants/typography';
import { tenanciesService } from '../../services/tenancies.service';

const STATUS_COLOR: Record<string, string> = {
  pending:  '#F59E0B',
  approved: '#12A376',
  rejected: '#EF4444',
};

export default function ApplicationsScreen() {
  const { theme }                   = useTheme();
  const insets                      = useSafeAreaInsets();
  const [applications, setApps]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing]         = useState<string | null>(null);
  const [rejectId, setRejectId]     = useState<string | null>(null);
  const [reason, setReason]         = useState('');
  const [filter, setFilter]         = useState<'pending' | 'all'>('pending');

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await tenanciesService.getReceivedApplications();
      setApps(Array.isArray(data) ? data : []);
    } catch { setApps([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    Alert.alert('Approve Application', 'This will create a tenancy agreement for the tenant.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve', style: 'default', onPress: async () => {
          setActing(id);
          try {
            await tenanciesService.approveApplication(id);
            Alert.alert('Done', 'Tenancy created. The tenant has been notified to sign the agreement.');
            load();
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message ?? 'Could not approve.');
          } finally { setActing(null); }
        }
      },
    ]);
  };

  const reject = async () => {
    if (!rejectId || !reason.trim()) return;
    setActing(rejectId);
    try {
      await tenanciesService.rejectApplication(rejectId, reason.trim());
      setRejectId(null);
      setReason('');
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not reject.');
    } finally { setActing(null); }
  };

  const displayed = filter === 'pending'
    ? applications.filter(a => a.status === 'pending')
    : applications;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 8 }}>
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[typography.h3, { color: theme.textPrimary }]}>Applications</Text>
          <Text style={[typography.caption, { color: theme.textMuted }]}>
            {applications.filter(a => a.status === 'pending').length} pending
          </Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterRow, { borderBottomColor: theme.border }]}>
        {(['pending', 'all'] as const).map(f => (
          <Pressable key={f} onPress={() => setFilter(f)}
            style={[styles.filterTab, { borderBottomColor: filter === f ? theme.primary : 'transparent' }]}>
            <Text style={[typography.small, { color: filter === f ? theme.primary : theme.textMuted, fontWeight: filter === f ? '700' : '400' }]}>
              {f === 'pending' ? 'Pending' : 'All'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={theme.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
        >
          {displayed.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={52} color={theme.textMuted} />
              <Text style={[typography.bodyMed, { color: theme.textPrimary, marginTop: 16 }]}>No applications yet</Text>
              <Text style={[typography.small, { color: theme.textMuted, marginTop: 6, textAlign: 'center' }]}>
                When tenants apply for your properties, they'll appear here.
              </Text>
            </View>
          ) : (
            displayed.map((app, i) => (
              <Animated.View key={app.id} entering={FadeInDown.delay(i * 60).springify()}>
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>

                  {/* Property */}
                  <View style={[styles.propRow, { borderBottomColor: theme.border }]}>
                    <Ionicons name="business-outline" size={14} color={theme.textMuted} />
                    <Text style={[typography.caption, { color: theme.textMuted, flex: 1 }]} numberOfLines={1}>
                      {app.property_title}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[app.status] + '20' }]}>
                      <Text style={[typography.caption, { color: STATUS_COLOR[app.status], fontWeight: '700', textTransform: 'capitalize' }]}>
                        {app.status}
                      </Text>
                    </View>
                  </View>

                  {/* Tenant info */}
                  <View style={styles.tenantRow}>
                    <View style={[styles.avatar, { backgroundColor: theme.primary + '20' }]}>
                      <Text style={[typography.bodyMed, { color: theme.primary }]}>
                        {app.tenant_first_name?.[0]}{app.tenant_last_name?.[0]}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>
                        {app.tenant_first_name} {app.tenant_last_name}
                      </Text>
                      <Text style={[typography.caption, { color: theme.textMuted }]}>{app.tenant_phone}</Text>
                    </View>
                  </View>

                  {/* Details */}
                  <View style={[styles.detailsRow, { borderTopColor: theme.border }]}>
                    <View style={styles.detail}>
                      <Text style={[typography.caption, { color: theme.textMuted }]}>Type</Text>
                      <Text style={[typography.small, { color: theme.textPrimary, textTransform: 'capitalize' }]}>{app.tenancy_type}</Text>
                    </View>
                    <View style={styles.detail}>
                      <Text style={[typography.caption, { color: theme.textMuted }]}>Move-in</Text>
                      <Text style={[typography.small, { color: theme.textPrimary }]}>
                        {new Date(app.move_in_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={styles.detail}>
                      <Text style={[typography.caption, { color: theme.textMuted }]}>Applied</Text>
                      <Text style={[typography.small, { color: theme.textMuted }]}>
                        {new Date(app.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                  </View>

                  {/* Message */}
                  {app.message ? (
                    <View style={[styles.messageBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                      <Text style={[typography.caption, { color: theme.textMuted, marginBottom: 2 }]}>Message</Text>
                      <Text style={[typography.small, { color: theme.textSecondary }]}>{app.message}</Text>
                    </View>
                  ) : null}

                  {/* Actions */}
                  {app.status === 'pending' && (
                    <View style={styles.actions}>
                      <Button
                        title="Approve"
                        onPress={() => approve(app.id)}
                        loading={acting === app.id}
                        size="sm"
                        style={{ flex: 1 }}
                      />
                      <Button
                        title="Reject"
                        onPress={() => { setRejectId(app.id); setReason(''); }}
                        variant="outline"
                        size="sm"
                        style={{ flex: 1 }}
                      />
                    </View>
                  )}

                  {app.status === 'rejected' && app.rejection_reason ? (
                    <Text style={[typography.caption, { color: theme.textMuted, marginTop: 8 }]}>
                      Reason: {app.rejection_reason}
                    </Text>
                  ) : null}

                </View>
              </Animated.View>
            ))
          )}
        </ScrollView>
      )}

      {/* Reject modal */}
      {rejectId && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: theme.surface }]}>
            <Text style={[typography.h4, { color: theme.textPrimary, marginBottom: 6 }]}>Reject Application</Text>
            <Text style={[typography.small, { color: theme.textMuted, marginBottom: 16 }]}>
              Give a brief reason — the tenant will be notified.
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. Property already taken, requirements not met..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
              style={[styles.rejectInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary }]}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <Button title="Cancel" variant="ghost" size="sm" style={{ flex: 1 }} onPress={() => setRejectId(null)} />
              <Button title="Reject" size="sm" style={{ flex: 1 }} loading={acting === rejectId}
                onPress={reject} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  filterRow:    { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  filterTab:    { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2 },
  scroll:       { padding: 16, gap: 14 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:        { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  card:         { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  propRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  tenantRow:    { flexDirection: 'row', alignItems: 'center', padding: 14 },
  avatar:       { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  detailsRow:   { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 12 },
  detail:       { flex: 1, gap: 2 },
  messageBox:   { margin: 14, marginTop: 0, borderRadius: 10, borderWidth: 1, padding: 10 },
  actions:      { flexDirection: 'row', gap: 10, padding: 14, paddingTop: 0 },
  modalOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  rejectInput:  { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, textAlignVertical: 'top', height: 90 },
});
