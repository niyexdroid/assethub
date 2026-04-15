import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  children:  React.ReactNode;
  onPress?:  () => void;
  style?:    ViewStyle;
  padding?:  number;
  radius?:   number;
  glow?:     'green' | 'gold';
}

export function Card({ children, onPress, style, padding = 16, radius = 16, glow }: Props) {
  const { theme } = useTheme();
  const scale     = useSharedValue(1);

  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const glowStyle = glow === 'green'
    ? { shadowColor: theme.primaryLight, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 }
    : glow === 'gold'
    ? { shadowColor: theme.accent,       shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 }
    : {};

  const inner = (
    <Animated.View style={[
      styles.card,
      { backgroundColor: theme.cardBg, borderColor: theme.cardBorder,
        borderRadius: radius, padding, ...glowStyle },
      anim, style,
    ]}>
      {children}
    </Animated.View>
  );

  if (!onPress) return inner;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1,    { damping: 15 }); }}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, shadowOffset: { width: 0, height: 4 } },
});
