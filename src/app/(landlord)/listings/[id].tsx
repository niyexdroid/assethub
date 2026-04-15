import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, interpolate,
  useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { Button } from '../../../components/ui/Button';
import { Badge }  from '../../../components/ui/Badge';
import { Card }   from '../../../components/ui/Card';
import { typography } from '../../../constants/typography';
import { propertiesService, Property } from '../../../services/properties.service';

const { width, height } = Dimensions.get('window');
const IMG_HEIGHT = height * 0.38;

export default function LandlordListingDetailScreen() {
  const { theme, isDark } = useTheme();
  const insets    = useSafeAreaInsets();
  const { id }    = useLocalSearchParams<{ id: string }>();
  const [property, setProperty]   = useState<Property | null>(null);
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState(false);
  const [toggling, setToggling]   = useState(false);
  const scrollY = useSharedValue(0);

  useEffect(() => {
    if (!id) return;
    propertiesService.getById(id).then(setProperty).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  const headerAnim = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [IMG_HEIGHT - 100, IMG_HEIGHT - 40], [0, 1]),
  }));

  const handleDelete = () => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await propertiesService.delete(id);
              router.replace('/(landlord)/listings');
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message ?? 'Could not delete listing.');
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleAvailability = async () => {
    if (!property || toggling) return;
    setToggling(true);
    try {
      const updated = await propertiesService.update(id, { is_available: !property.is_available });
      setProperty(updated);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not update availability.');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Ionicons name="alert-circle-outline" size={52} color={theme.textMuted} />
        <Text style={[typography.bodyMed, { color: theme.textPrimary, marginTop: 16 }]}>Listing not found</Text>
        <Button title="Go back" onPress={() => router.back()} variant="ghost" size="sm" style={{ marginTop: 16 }} />
      </View>
    );
  }

  const p = property;
  const rent = p.monthly_rent ?? p.yearly_rent ?? 0;
  const mode = p.tenancy_mode === 'yearly' ? 'yr' : 'mo';

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>

      {/* Floating header */}
      <Animated.View style={[styles.floatingHeader, { paddingTop: insets.top }, headerAnim]}>
        <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <Text style={[typography.h4, { color: theme.textPrimary }]} numberOfLines={1}>{p.title}</Text>
      </Animated.View>

      {/* Back + edit + delete buttons */}
      <View style={[styles.topButtons, { top: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.circleBtn}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable onPress={() => router.push({ pathname: '/(landlord)/listings/create' as any, params: { edit_id: id } })} style={styles.circleBtn}>
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            <Ionicons name="create-outline" size={20} color="#fff" />
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.circleBtn} disabled={deleting}>
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
          </Pressable>
        </View>
      </View>

      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>

        {/* Hero image */}
        <View style={styles.imageContainer}>
          {p.photos?.[0]
            ? <Image source={{ uri: p.photos[0] }} style={styles.heroImage} resizeMode="cover" />
            : <View style={[styles.heroImage, { backgroundColor: theme.surfaceRaised, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="home-outline" size={72} color={theme.textMuted} />
              </View>
          }
          <LinearGradient colors={['transparent', theme.background]} style={styles.imageGradient} />
        </View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: theme.background }]}>

          {/* Title + status */}
          <Animated.View entering={FadeInDown.delay(0).springify()}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <View style={[styles.row, { marginBottom: 8 }]}>
                  <Badge label={p.lga} variant="default" />
                  <Badge
                    label={p.is_available ? 'Available' : 'Occupied'}
                    variant={p.is_available ? 'info' : 'success'}
                  />
                  {p.approval_status !== 'approved' && (
                    <Badge label={p.approval_status} variant="warning" />
                  )}
                </View>
                <Text style={[typography.h2, { color: theme.textPrimary }]}>{p.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Ionicons name="location-outline" size={14} color={theme.textMuted} />
                  <Text style={[typography.body, { color: theme.textMuted }]} numberOfLines={2}>{p.address}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Price cards */}
          <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.priceRow}>
            {p.monthly_rent ? (
              <Card style={styles.priceCard} glow="green">
                <Text style={[typography.caption, { color: theme.textMuted }]}>Per Month</Text>
                <Text style={[typography.price, { color: theme.primaryLight }]}>
                  {'\u20A6'}{p.monthly_rent.toLocaleString()}
                </Text>
              </Card>
            ) : null}
            {p.yearly_rent ? (
              <Card style={styles.priceCard} glow="gold">
                <Text style={[typography.caption, { color: theme.textMuted }]}>Per Year</Text>
                <Text style={[typography.price, { color: theme.accent }]}>
                  {'\u20A6'}{p.yearly_rent.toLocaleString()}
                </Text>
              </Card>
            ) : null}
          </Animated.View>

          {/* Specs */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Card style={styles.specsCard}>
              <View style={styles.specsRow}>
                {[
                  { icon: 'bed-outline'   as const, label: `${p.bedrooms ?? '—'} Bedrooms`                               },
                  { icon: 'water-outline' as const, label: `${p.bathrooms ?? '—'} Bathrooms`                             },
                  { icon: 'cash-outline'  as const, label: `${'\u20A6'}${(p.caution_fee ?? 0).toLocaleString()} caution` },
                ].map((s, i) => (
                  <View key={i} style={styles.specItem}>
                    <Ionicons name={s.icon} size={24} color={theme.primary} />
                    <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 4, textAlign: 'center' }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </Animated.View>

          {/* Additional fees */}
          <Animated.View entering={FadeInDown.delay(140).springify()}>
            <Card>
              <View style={styles.feeRow}>
                <Text style={[typography.body, { color: theme.textSecondary }]}>Agency Fee</Text>
                <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>
                  {'\u20A6'}{(p.agency_fee ?? 0).toLocaleString()}
                </Text>
              </View>
              <View style={[styles.feeRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border, marginTop: 12, paddingTop: 12 }]}>
                <Text style={[typography.body, { color: theme.textSecondary }]}>Available Units</Text>
                <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>{p.available_units ?? '—'}</Text>
              </View>
              <View style={[styles.feeRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border, marginTop: 12, paddingTop: 12 }]}>
                <Text style={[typography.body, { color: theme.textSecondary }]}>Tenancy Mode</Text>
                <Text style={[typography.bodyMed, { color: theme.textPrimary, textTransform: 'capitalize' }]}>{p.tenancy_mode}</Text>
              </View>
            </Card>
          </Animated.View>

          {/* Description */}
          {p.description ? (
            <Animated.View entering={FadeInDown.delay(180).springify()}>
              <Text style={[typography.h4, { color: theme.textPrimary, marginBottom: 8 }]}>Description</Text>
              <Text style={[typography.body, { color: theme.textSecondary, lineHeight: 24 }]}>{p.description}</Text>
            </Animated.View>
          ) : null}

          {/* Amenities */}
          {p.amenities?.length > 0 && (
            <Animated.View entering={FadeInDown.delay(220).springify()}>
              <Text style={[typography.h4, { color: theme.textPrimary, marginBottom: 12 }]}>Amenities</Text>
              <View style={styles.amenities}>
                {p.amenities.map((a, i) => (
                  <View key={i} style={[styles.amenityPill, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
                    <Ionicons name="checkmark" size={12} color={theme.success} />
                    <Text style={[typography.label, { color: theme.textSecondary }]}>{a}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          <View style={{ height: 160 }} />
        </View>
      </Animated.ScrollView>

      {/* Sticky actions */}
      <View style={[styles.cta, { backgroundColor: theme.background, borderTopColor: theme.border, paddingBottom: insets.bottom + 12 }]}>
        <Button
          title={p.is_available ? 'Mark as Occupied' : 'Mark as Available'}
          onPress={handleToggleAvailability}
          variant={p.is_available ? 'outline' : 'primary'}
          size="lg"
          loading={toggling}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: 20, paddingBottom: 12, alignItems: 'center', justifyContent: 'flex-end', height: 80 },
  topButtons:     { position: 'absolute', left: 20, right: 20, zIndex: 20, flexDirection: 'row', justifyContent: 'space-between' },
  circleBtn:      { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  imageContainer: { height: IMG_HEIGHT },
  heroImage:      { width, height: IMG_HEIGHT },
  imageGradient:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  content:        { paddingHorizontal: 20, paddingTop: 20, gap: 20 },
  titleRow:       { flexDirection: 'row', justifyContent: 'space-between' },
  row:            { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  priceRow:       { flexDirection: 'row', gap: 12 },
  priceCard:      { flex: 1, gap: 4 },
  specsCard:      {},
  specsRow:       { flexDirection: 'row', justifyContent: 'space-around' },
  specItem:       { alignItems: 'center', flex: 1 },
  feeRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amenities:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityPill:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  cta:            { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
});
