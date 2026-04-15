import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../constants/typography';

type Variant = 'success' | 'danger' | 'warning' | 'info' | 'default';

interface Props {
  label:    string;
  variant?: Variant;
  dot?:     boolean;
}

export function Badge({ label, variant = 'default', dot }: Props) {
  const { theme } = useTheme();

  const colors: Record<Variant, { bg: string; text: string }> = {
    success: { bg: theme.successBg, text: theme.success },
    danger:  { bg: theme.dangerBg,  text: theme.danger  },
    warning: { bg: theme.warningBg, text: theme.warning  },
    info:    { bg: theme.infoBg,    text: theme.info     },
    default: { bg: theme.surfaceRaised, text: theme.textSecondary },
  };

  const c = colors[variant];

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      {dot && <View style={[styles.dot, { backgroundColor: c.text }]} />}
      <Text style={[typography.caption, { color: c.text, fontWeight: '600' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  dot:   { width: 5, height: 5, borderRadius: 3 },
});
