import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { PropertyCard } from '../../components/property/PropertyCard';
import { typography } from '../../constants/typography';
import { LAGOS_LGAS } from '../../constants/lgas';
import { propertiesService, Property } from '../../services/properties.service';
import { useAuthStore } from '../../store/auth.store';

const LGAS  = ['All', ...LAGOS_LGAS];
const TYPES = ['All', 'Apartment', 'Self Contain', 'Room', 'Hostel', 'Bedspace'];

export default function HomeScreen() {
  const { theme }               = useTheme();
  const insets                  = useSafeAreaInsets();
  const { user }                = useAuthStore();
  const [lga, setLga]           = useState('All');
  const [type, setType]         = useState('All');
  const [query, setQuery]       = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState('');

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const filters: Record<string, any> = {};
      if (lga  !== 'All') filters.lga  = lga;
      if (type !== 'All') filters.property_type = type.toLowerCase().replace(' ', '_');
      if (query.trim())   filters.query = query.trim();

      const result = await propertiesService.search(filters);
      setProperties(Array.isArray(result) ? result : result.data ?? []);
    } catch {
      setError('Could not load properties. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lga, type, query]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>

      {/* Sticky header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: theme.background, borderBottomColor: theme.border }]}>

        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.titleRow}>
          <View>
            <Text style={[typography.h2, { color: theme.textPrimary }]}>
              {user?.first_name ? `${greeting()}, ${user.first_name}` : greeting()}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={() => router.push('/(shared)/notifications')}
              style={[styles.settingsBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="notifications-outline" size={22} color={theme.textSecondary} />
            </Pressable>
            <Pressable onPress={() => router.push('/(shared)/settings')}
              style={[styles.settingsBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="person-circle-outline" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Search bar */}
        <Animated.View entering={FadeInDown.delay(60).springify()}
          style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            placeholder="Search area, property name..."
            placeholderTextColor={theme.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => load()}
            style={[typography.body, { flex: 1, color: theme.textPrimary, paddingVertical: 0 }]}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </Pressable>
          )}
        </Animated.View>

        {/* Type chips */}
        <Animated.ScrollView entering={FadeInDown.delay(100).springify()}
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          {TYPES.map(t => (
            <Pressable key={t} onPress={() => setType(t)}>
              <View style={[styles.chip, {
                backgroundColor: type === t ? theme.primary : theme.surface,
                borderColor:     type === t ? theme.primary : theme.border,
              }]}>
                <Text style={[typography.label, { color: type === t ? '#fff' : theme.textSecondary }]}>{t}</Text>
              </View>
            </Pressable>
          ))}
        </Animated.ScrollView>

        {/* LGA chips */}
        <Animated.ScrollView entering={FadeInDown.delay(130).springify()}
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chips, { paddingTop: 0, paddingBottom: 12 }]}>
          {LGAS.map(l => (
            <Pressable key={l} onPress={() => setLga(l)}>
              <View style={[styles.chip, {
                backgroundColor: lga === l ? theme.accent + '20' : 'transparent',
                borderColor:     lga === l ? theme.accent : theme.border,
              }]}>
                <Text style={[typography.label, { color: lga === l ? theme.accent : theme.textMuted }]}>{l}</Text>
              </View>
            </Pressable>
          ))}
        </Animated.ScrollView>
      </View>

      {/* Listings */}
      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
      >
        <View style={styles.resultHeader}>
          <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>
            {loading ? 'Loading...' : `${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`}
          </Text>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="swap-vertical-outline" size={14} color={theme.primaryLight} />
            <Text style={[typography.label, { color: theme.primaryLight }]}>Sort</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : error ? (
          <View style={styles.empty}>
            <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
            <Text style={[typography.bodyMed, { color: theme.textPrimary, marginTop: 16 }]}>Connection error</Text>
            <Text style={[typography.small, { color: theme.textMuted, marginTop: 4 }]}>{error}</Text>
          </View>
        ) : properties.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color={theme.textMuted} />
            <Text style={[typography.bodyMed, { color: theme.textPrimary, marginTop: 16 }]}>No properties found</Text>
            <Text style={[typography.small, { color: theme.textMuted, marginTop: 4 }]}>Try adjusting your filters</Text>
          </View>
        ) : (
          properties.map((p, i) => <PropertyCard key={p.id} property={p} index={i} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:       { paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  titleRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  settingsBtn:  { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  searchBar:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
                  borderRadius: 12, paddingHorizontal: 14, height: 48, marginBottom: 4 },
  chips:        { paddingVertical: 8, gap: 8 },
  chip:         { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  list:         { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 140 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  empty:        { alignItems: 'center', paddingTop: 60 },
});
