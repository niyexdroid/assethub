import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, interpolate,
  useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
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
import { PhotoCarousel } from '../../../components/property/PhotoCarousel';
import { formatNGN } from '../../../utils/format';

const { width, height } = Dimensions.get('window');
const IMG_HEIGHT = height * 0.45;

export default function PropertyDetailScreen() {
  const { theme, isDark } = useTheme();
  const insets    = useSafeAreaInsets();
  const { id }    = useLocalSearchParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saved, setSaved]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const scrollY   = useSharedValue(0);

  useEffect(() => {
    if (!id) return;
    propertiesService.getById(id).then(setProperty).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  const headerAnim = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [IMG_HEIGHT - 100, IMG_HEIGHT - 40], [0, 1]),
  }));

  const toggleSave = async () => {
    if (!id || saving) return;
    setSaving(true);
    try {
      if (saved) await propertiesService.unsave(id);
      else await propertiesService.save(id);
      setSaved(!saved);
    } catch { /* ignore */ }
    finally { setSaving(false); }
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
        <Text style={[typography.bodyMed, { color: theme.textPrimary, marginTop: 16 }]}>Property not found</Text>
        <Button title="Go back" onPress={() => router.back()} variant="ghost" size="sm" style={{ marginTop: 16 }} />
      </View>
    );
  }

  const p = property;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>

      {/* Floating header */}
      <Animated.View style={[styles.floatingHeader, { paddingTop: insets.top }, headerAnim]}>
        <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <Text style={[typography.h4, { color: theme.textPrimary }]} numberOfLines={1}>{p.title}</Text>
      </Animated.View>

      {/* Back + Save buttons */}
      <View style={[styles.topButtons, { top: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.circleBtn}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        <Pressable onPress={toggleSave} style={styles.circleBtn}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? '#FF6B6B' : '#fff'} />
        </Pressable>
      </View>

      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>

        <PhotoCarousel photos={p.photos ?? []} height={IMG_HEIGHT} gradientEnd={theme.background} />

        {/* Content */}
        <View style={[styles.content, { backgroundColor: theme.background }]}>

          {/* Title + badges */}
          <Animated.View entering={FadeInDown.delay(0).springify()}>
            <View style={styles.row}>
              <Badge label={p.lga} variant="default" />
              {p.listing_type === 'student' && <Badge label="Student" variant="info" />}
              <Badge label={p.tenancy_mode === 'both' ? 'Monthly & Yearly' : p.tenancy_mode} variant="success" />
            </View>
            <Text style={[typography.h2, { color: theme.textPrimary, marginTop: 10 }]}>{p.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Ionicons name="location-outline" size={14} color={theme.textMuted} />
              <Text style={[typography.body, { color: theme.textMuted }]}>{p.address}</Text>
            </View>
          </Animated.View>

          {/* Price cards */}
          <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.priceRow}>
            {p.monthly_rent && (
              <Card style={styles.priceCard} glow="green">
                <Text style={[typography.caption, { color: theme.textMuted }]}>Per Month</Text>
                <Text style={[typography.price, { color: theme.primaryLight }]}>
                  {formatNGN(p.monthly_rent)}
                </Text>
              </Card>
            )}
            {p.yearly_rent && (
              <Card style={styles.priceCard} glow="gold">
                <Text style={[typography.caption, { color: theme.textMuted }]}>Per Year</Text>
                <Text style={[typography.price, { color: theme.accent }]}>
                  {formatNGN(p.yearly_rent)}
                </Text>
              </Card>
            )}
          </Animated.View>

          {/* Specs */}
          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <Card style={styles.specsCard}>
              <View style={styles.specsRow}>
                {[
                  { icon: 'bed-outline'   as const, label: `${p.bedrooms ?? '—'} Bedrooms`                                    },
                  { icon: 'water-outline' as const, label: `${p.bathrooms ?? '—'} Bathrooms`                                  },
                  { icon: 'cash-outline'  as const, label: `${formatNGN(p.caution_fee ?? 0)} caution`      },
                ].map((s, i) => (
                  <View key={i} style={styles.specItem}>
                    <Ionicons name={s.icon} size={24} color={theme.primary} />
                    <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 4, textAlign: 'center' }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </Animated.View>

          {/* Description */}
          {p.description ? (
            <Animated.View entering={FadeInDown.delay(160).springify()}>
              <Text style={[typography.h4, { color: theme.textPrimary, marginBottom: 8 }]}>About</Text>
              <Text style={[typography.body, { color: theme.textSecondary, lineHeight: 24 }]}>{p.description}</Text>
            </Animated.View>
          ) : null}

          {/* Amenities */}
          {p.amenities?.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200).springify()} style={{ marginTop: 4 }}>
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

          {/* Landlord */}
          {(p.landlord_first_name || p.landlord_last_name) && (
            <Animated.View entering={FadeInDown.delay(240).springify()} style={{ marginTop: 4 }}>
              <Text style={[typography.h4, { color: theme.textPrimary, marginBottom: 12 }]}>Landlord</Text>
              <Card style={styles.landlordCard}>
                <View style={[styles.avatar, { backgroundColor: theme.primaryGrad[0] + '30' }]}>
                  <Ionicons name="person-outline" size={24} color={theme.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>
                    {p.landlord_first_name} {p.landlord_last_name}
                  </Text>
                  <Badge label="Verified" variant="success" />
                </View>
              </Card>
            </Animated.View>
          )}

          {/* CTA */}
          <View style={[styles.cta, { borderTopColor: theme.border }]}>
            <View style={styles.ctaFees}>
              <Text style={[typography.caption, { color: theme.textMuted }]}>Agency fee</Text>
              <Text style={[typography.label, { color: theme.textPrimary }]}>{formatNGN(p.agency_fee ?? 0)}</Text>
            </View>
            <Button
              title="Apply Now"
              onPress={() => router.push({ pathname: '/(tenant)/apply/[propertyId]', params: { propertyId: p.id } })}
              size="lg"
              style={{ flex: 1, marginLeft: 16 }}
            />
          </View>

          <View style={{ height: insets.bottom + 100 }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: 20, paddingBottom: 12, alignItems: 'center', justifyContent: 'flex-end', height: 80 },
  topButtons:     { position: 'absolute', left: 20, right: 20, zIndex: 20, flexDirection: 'row', justifyContent: 'space-between' },
  circleBtn:      { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  content:        { paddingHorizontal: 20, paddingTop: 20, gap: 20 },
  row:            { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  priceRow:       { flexDirection: 'row', gap: 12 },
  priceCard:      { flex: 1, gap: 4 },
  specsCard:      {},
  specsRow:       { flexDirection: 'row', justifyContent: 'space-around' },
  specItem:       { alignItems: 'center', flex: 1 },
  amenities:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityPill:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  landlordCard:   { flexDirection: 'row', alignItems: 'center' },
  avatar:         { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cta:            { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth },
  ctaFees:        { gap: 2 },
});
