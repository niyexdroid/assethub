import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../constants/typography';

interface Props {
  icon:      string;       // emoji or icon name
  label:     string;
  value?:    string;
  right?:    React.ReactNode;
  onPress?:  () => void;
  danger?:   boolean;
}

export function SettingsRow({ icon, label, value, right, onPress, danger }: Props) {
  const { theme } = useTheme();
  const scale     = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.98); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      disabled={!onPress && !right}
    >
      <Animated.View style={[styles.row, animStyle, {
        backgroundColor: theme.surface,
        borderBottomColor: theme.border,
      }]}>
        {/* Icon bubble */}
        <View style={[styles.iconBubble, { backgroundColor: theme.surfaceRaised }]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>

        {/* Label + value */}
        <View style={styles.content}>
          <Text style={[typography.bodyMed, { color: danger ? theme.danger : theme.textPrimary }]}>
            {label}
          </Text>
          {value && (
            <Text style={[typography.small, { color: theme.textMuted }]}>{value}</Text>
          )}
        </View>

        {/* Right slot — toggle, chevron, badge */}
        <View style={styles.right}>
          {right ?? (onPress && (
            <Text style={{ color: theme.textMuted, fontSize: 18 }}>›</Text>
          ))}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 16,
    paddingVertical:   14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBubble: {
    width: 36, height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText:  { fontSize: 18 },
  content:   { flex: 1, gap: 2 },
  right:     { marginLeft: 8 },
});
