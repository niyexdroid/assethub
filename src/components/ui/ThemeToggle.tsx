import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

const TRACK_W  = 52;
const TRACK_H  = 28;
const THUMB_SZ = 22;
const TRAVEL   = TRACK_W - THUMB_SZ - 6;

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  const progress = useSharedValue(isDark ? 0 : 1);

  useEffect(() => {
    progress.value = withSpring(isDark ? 0 : 1, { damping: 14, stiffness: 200 });
  }, [isDark]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(isDark ? 3 : TRAVEL, { damping: 14, stiffness: 200 }) }],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['#21262D', '#12A376']
    ),
  }));

  const moonStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isDark ? 1 : 0, { duration: 200 }),
  }));

  const sunStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isDark ? 0 : 1, { duration: 200 }),
  }));

  return (
    <Pressable onPress={toggleTheme} hitSlop={8} accessibilityRole="switch">
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.iconLeft, moonStyle]}>
          <Text style={styles.icon}>🌙</Text>
        </Animated.View>
        <Animated.View style={[styles.iconRight, sunStyle]}>
          <Text style={styles.icon}>☀️</Text>
        </Animated.View>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width:          TRACK_W,
    height:         TRACK_H,
    borderRadius:   TRACK_H / 2,
    justifyContent: 'center',
    overflow:       'hidden',
  },
  thumb: {
    position:        'absolute',
    width:           THUMB_SZ,
    height:          THUMB_SZ,
    borderRadius:    THUMB_SZ / 2,
    backgroundColor: '#FFFFFF',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.25,
    shadowRadius:    4,
    elevation:       4,
  },
  iconLeft:  { position: 'absolute', left: 5,  zIndex: 0 },
  iconRight: { position: 'absolute', right: 5, zIndex: 0 },
  icon:      { fontSize: 12 },
});
