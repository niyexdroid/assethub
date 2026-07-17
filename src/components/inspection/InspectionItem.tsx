import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Badge } from '../ui/Badge';
import { typography } from '../../constants/typography';
import type { InspectionItem as InspectionItemType } from '../../types/inspections';

const CONDITION_BADGE: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
  good:    { variant: 'success', label: 'Good' },
  fair:    { variant: 'info',    label: 'Fair' },
  damaged: { variant: 'warning', label: 'Damaged' },
  missing: { variant: 'danger',  label: 'Missing' },
};

interface Props {
  item: InspectionItemType;
  onPress?: () => void;
  onDelete?: () => void;
}

export function InspectionItem({ item, onPress, onDelete }: Props) {
  const { theme } = useTheme();
  const badge = CONDITION_BADGE[item.condition] ?? CONDITION_BADGE.good;
  const thumbnail = item.photo_urls?.[0];

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      {/* Thumbnail */}
      {thumbnail ? (
        <Image source={{ uri: thumbnail }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumbPlaceholder, { backgroundColor: theme.border }]}>
          <Ionicons name="image-outline" size={20} color={theme.textMuted} />
        </View>
      )}

      {/* Info */}
      <View style={styles.info}>
        <Text style={[typography.bodyMed, { color: theme.textPrimary }]} numberOfLines={1}>
          {item.item_name}
        </Text>
        {item.notes ? (
          <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]} numberOfLines={1}>
            {item.notes}
          </Text>
        ) : null}
      </View>

      {/* Condition + Delete */}
      <View style={styles.actions}>
        <Badge label={badge.label} variant={badge.variant} />
        {onDelete ? (
          <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color={theme.danger} />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 12,
  },
  thumb:           { width: 48, height: 48, borderRadius: 8 },
  thumbPlaceholder: { width: 48, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  info:            { flex: 1 },
  actions:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deleteBtn:       { padding: 4 },
});
