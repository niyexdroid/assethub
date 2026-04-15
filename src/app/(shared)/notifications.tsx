import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';
import { typography } from '../../constants/typography';
import { notificationsService, AppNotification } from '../../services/notifications.service';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TYPE_ICON: Record<string, { icon: IoniconsName; color: string }> = {
  payment:      { icon: 'cash-outline',              color: '#4ADE80' },
  complaint:    { icon: 'construct-outline',          color: '#FB923C' },
  tenancy:      { icon: 'home-outline',               color: '#60A5FA' },
  kyc:          { icon: 'shield-checkmark-outline',   color: '#A78BFA' },
  roommate:     { icon: 'people-outline',             color: '#F472B6' },
  otp:          { icon: 'lock-closed-outline',        color: '#94A3B8' },
  default:      { icon: 'notifications-outline',      color: '#94A3B8' },
};

function getIconConfig(type: string) {
  const key = Object.keys(TYPE_ICON).find(k => type?.toLowerCase().includes(k));
  return TYPE_ICON[key ?? 'default'];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

export default function NotificationsScreen() {
  const { theme }                   = useTheme();
  const insets                      = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marking, setMarking]       = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await notificationsService.list();
      setNotifications(Array.isArray(data) ? data : []);
    } catch { /* show empty */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAll = async () => {
    setMarking(true);
    try {
      await notificationsService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { /* ignore */ }
    finally { setMarking(false); }
  };

  const markOne = async (id: string) => {
    try {
      await notificationsService.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* ignore */ }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
        <View>
          <Text style={[typography.h2, { color: theme.textPrimary }]}>Notifications</Text>
          <Text style={[typography.small, { color: theme.textMuted }]}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          {unreadCount > 0 && (
            <Button title="Mark all read" onPress={markAll} variant="outline" size="sm" loading={marking} />
          )}
          <Pressable onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </Pressable>
        </View>
      </Animated.View>

      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
      ) : notifications.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={52} color={theme.textMuted} />
          <Text style={[typography.bodyMed, { color: theme.textPrimary, marginTop: 16 }]}>No notifications yet</Text>
          <Text style={[typography.small, { color: theme.textMuted, marginTop: 6, textAlign: 'center' }]}>
            You'll be notified about payments, complaints, and tenancy updates.
          </Text>
        </Animated.View>
      ) : (
        <View style={{ gap: 8 }}>
          {notifications.map((n, i) => {
            const cfg = getIconConfig(n.type);
            return (
              <Animated.View key={n.id} entering={FadeInDown.delay(i * 40).springify()}>
                <Pressable
                  onPress={() => { if (!n.is_read) markOne(n.id); }}
                  style={[
                    styles.card,
                    {
                      backgroundColor: n.is_read ? theme.surface : theme.primary + '0D',
                      borderColor: n.is_read ? theme.border : theme.primary + '33',
                    },
                  ]}
                >
                  {/* Unread dot */}
                  {!n.is_read && (
                    <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
                  )}

                  <View style={[styles.iconWrap, { backgroundColor: cfg.color + '20' }]}>
                    <Ionicons name={cfg.icon} size={22} color={cfg.color} />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[typography.bodyMed, { color: theme.textPrimary }]} numberOfLines={1}>
                      {n.title}
                    </Text>
                    <Text style={[typography.small, { color: theme.textSecondary, marginTop: 2, lineHeight: 18 }]} numberOfLines={2}>
                      {n.body}
                    </Text>
                    <Text style={[typography.caption, { color: theme.textMuted, marginTop: 4 }]}>
                      {timeAgo(n.created_at)}
                    </Text>
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
  container:  { padding: 20 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  empty:      { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  card:       { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 16, borderWidth: 1, padding: 14, position: 'relative' },
  iconWrap:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  unreadDot:  { position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: 4 },
});
