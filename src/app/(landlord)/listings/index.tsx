import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { Button } from '../../../components/ui/Button';
import { Badge }  from '../../../components/ui/Badge';
import { typography } from '../../../constants/typography';
import { propertiesService, Property } from '../../../services/properties.service';

export default function ListingsScreen() {
  const { theme }                   = useTheme();
  const insets                      = useSafeAreaInsets();
  const [listings, setListings]     = useState<Property[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await propertiesService.getLandlordProperties();
      setListings(Array.isArray(data) ? data : []);
    } catch { /* show empty state */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const available = listings.filter(l => l.is_available);
  const occupied  = listings.filter(l => !l.is_available);

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
          <Text style={[typography.h2, { color: theme.textPrimary }]}>My Listings</Text>
          <Text style={[typography.small, { color: theme.textMuted }]}>
            {loading ? '...' : `${available.length} available`}
          </Text>
        </View>
        <Button title="+ Add" onPress={() => router.push('/(landlord)/listings/create')} size="sm" />
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.statsRow}>
        {[
          { label: 'Total',     value: listings.length,  color: theme.textPrimary },
          { label: 'Occupied',  value: occupied.length,  color: theme.success     },
          { label: 'Available', value: available.length, color: theme.info        },
        ].map(s => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[typography.h2, { color: s.color }]}>{loading ? '...' : s.value}</Text>
            <Text style={[typography.caption, { color: theme.textMuted }]}>{s.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* List */}
      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
      ) : listings.length === 0 ? (
        <Animated.View entering={FadeInDown.springify()} style={styles.empty}>
          <Ionicons name="home-outline" size={52} color={theme.textMuted} />
          <Text style={[typography.bodyMed, { color: theme.textPrimary, marginTop: 16 }]}>No listings yet</Text>
          <Text style={[typography.small, { color: theme.textMuted, marginTop: 6, textAlign: 'center' }]}>
            Tap "+ Add" to list your first property.
          </Text>
        </Animated.View>
      ) : (
        <View style={{ gap: 12 }}>
          {listings.map((listing, i) => {
            const rent = listing.monthly_rent ?? listing.yearly_rent ?? 0;
            const mode = listing.tenancy_mode === 'yearly' ? 'yr' : 'mo';
            const status = listing.is_available ? 'available' : 'occupied';
            return (
              <Animated.View key={listing.id} entering={FadeInDown.delay(100 + i * 50).springify()}>
                <Pressable
                  onPress={() => router.push({ pathname: '/(landlord)/listings/[id]' as any, params: { id: listing.id } })}
                  style={({ pressed }) => [styles.card, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.85 : 1 }]}
                >
                  <View style={styles.cardIcon}>
                    <Ionicons name="home-outline" size={24} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[typography.bodyMed, { color: theme.textPrimary }]} numberOfLines={1}>{listing.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <Ionicons name="location-outline" size={12} color={theme.textMuted} />
                      <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={1}>{listing.address}</Text>
                    </View>
                    <Text style={[typography.small, { color: theme.primaryLight, fontWeight: '600', marginTop: 4 }]}>
                      ₦{rent.toLocaleString('en-NG')}/{mode}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Badge
                      label={status === 'occupied' ? 'Occupied' : 'Available'}
                      variant={status === 'occupied' ? 'success' : 'info'}
                    />
                    {(listing as any).active_tenants > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="person-outline" size={12} color={theme.textMuted} />
                        <Text style={[typography.caption, { color: theme.textMuted }]}>{(listing as any).active_tenants}</Text>
                      </View>
                    )}
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
  container: { padding: 20 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  statsRow:  { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard:  { flex: 1, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 12, alignItems: 'center' },
  card:      { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  cardIcon:  { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,110,78,0.1)' },
  empty:     { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
});
