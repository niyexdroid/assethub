import React from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { typography } from '../../constants/typography';

const { width } = Dimensions.get('window');
const CARD_W    = width - 40;

interface Props {
  property: {
    id:            string;
    title:         string;
    address:       string;
    lga:           string;
    monthly_rent?: number;
    yearly_rent?:  number;
    tenancy_mode:  string;
    photos:        string[];
    bedrooms?:     number;
    bathrooms?:    number;
    listing_type:  string;
    amenities:     string[];
  };
  index?: number;
}

function formatNGN(amount: number) {
  return '₦' + amount.toLocaleString('en-NG');
}

export function PropertyCard({ property: p, index = 0 }: Props) {
  const { theme } = useTheme();
  const photo     = p.photos?.[0];
  const rentLabel = p.tenancy_mode === 'yearly'
    ? `${formatNGN(p.yearly_rent ?? 0)}/yr`
    : `${formatNGN(p.monthly_rent ?? 0)}/mo`;

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <Card onPress={() => router.push(`/(tenant)/property/${p.id}`)} style={styles.card} padding={0}>

        {/* Image / placeholder */}
        <View style={styles.imageWrap}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.placeholder, { backgroundColor: theme.surfaceRaised }]}>
              <Ionicons name="home-outline" size={48} color={theme.textMuted} />
            </View>
          )}

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.65)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Top badges */}
          <View style={styles.imageBadges}>
            {p.listing_type === 'student' && <Badge label="Student" variant="info" />}
            <Badge label={p.lga} variant="default" />
          </View>

          {/* Price bottom-left */}
          <View style={styles.priceOverlay}>
            <Text style={[typography.priceSm, { color: '#fff' }]}>{rentLabel}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={[styles.details, { backgroundColor: theme.surface }]}>
          <Text style={[typography.h4, { color: theme.textPrimary }]} numberOfLines={1}>
            {p.title}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Ionicons name="location-outline" size={13} color={theme.textMuted} />
            <Text style={[typography.small, { color: theme.textMuted, flex: 1 }]} numberOfLines={1}>
              {p.address}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            {p.bedrooms != null && (
              <View style={styles.stat}>
                <Ionicons name="bed-outline" size={13} color={theme.textSecondary} />
                <Text style={[typography.label, { color: theme.textSecondary }]}>{p.bedrooms} bed</Text>
              </View>
            )}
            {p.bathrooms != null && (
              <View style={styles.stat}>
                <Ionicons name="water-outline" size={13} color={theme.textSecondary} />
                <Text style={[typography.label, { color: theme.textSecondary }]}>{p.bathrooms} bath</Text>
              </View>
            )}
            {p.amenities?.slice(0, 2).map((a, i) => (
              <View key={i} style={[styles.statPill, { backgroundColor: theme.surfaceRaised }]}>
                <Text style={[typography.caption, { color: theme.textMuted }]}>{a}</Text>
              </View>
            ))}
          </View>
        </View>

      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card:         { width: CARD_W, marginBottom: 16, overflow: 'hidden' },
  imageWrap:    { height: 190, overflow: 'hidden', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  image:        { width: '100%', height: '100%' },
  placeholder:  { alignItems: 'center', justifyContent: 'center' },
  imageBadges:  { position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6 },
  priceOverlay: { position: 'absolute', bottom: 12, left: 12 },
  details:      { padding: 14, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  stats:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  stat:         { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statPill:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
});
