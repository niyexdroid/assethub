import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../constants/typography';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TierConfig {
  label: string;
  icon: IoniconsName;
  colorKey: 'info' | 'success' | 'accent';
}

const TIERS: Record<number, TierConfig> = {
  1: { label: 'Identity Verified', icon: 'shield-checkmark-outline', colorKey: 'info' },
  2: { label: 'Ownership Verified', icon: 'home-outline', colorKey: 'success' },
  3: { label: 'AssetHub Trusted', icon: 'star-outline', colorKey: 'accent' },
};

interface Props {
  tier: number | null | undefined;
  /** Show full label instead of compact tier name. Default false. */
  expanded?: boolean;
}

export function VerificationBadge({ tier, expanded = false }: Props) {
  const { theme } = useTheme();

  if (!tier || tier < 1 || tier > 3) return null;

  const cfg = TIERS[tier];
  if (!cfg) return null;

  const colorMap = {
    info:    { text: theme.info,    bg: theme.infoBg },
    success: { text: theme.success, bg: theme.successBg },
    accent:  { text: theme.accent,  bg: theme.warningBg },
  };

  const { text, bg } = colorMap[cfg.colorKey];
  const label = expanded ? cfg.label : cfg.label.replace(' Verified', '');

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Ionicons name={cfg.icon} size={12} color={text} />
      <Text style={[typography.caption, { color: text, fontWeight: '600' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
});
