import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../constants/typography';

interface Props {
  title:      string;
  onPress:    () => void;
  variant?:   'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?:      'sm' | 'md' | 'lg';
  loading?:   boolean;
  disabled?:  boolean;
  style?:     ViewStyle;
  icon?:      React.ReactNode;
}

const heights = { sm: 40, md: 50, lg: 56 };
const radii   = { sm: 10, md: 14, lg: 16 };

export function Button({ title, onPress, variant = 'primary', size = 'md', loading, disabled, style, icon }: Props) {
  const { theme } = useTheme();
  const scale     = useSharedValue(1);
  const opacity   = useSharedValue(1);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  const onIn  = () => { scale.value = withSpring(0.96, { damping: 15 }); opacity.value = withTiming(0.85); };
  const onOut = () => { scale.value = withSpring(1,    { damping: 15 }); opacity.value = withTiming(1); };

  const h = heights[size];
  const r = radii[size];
  const isDisabled = disabled || loading;

  const content = (
    <>
      {loading
        ? <ActivityIndicator color={variant === 'outline' ? theme.primary : '#fff'} />
        : <>
            {icon}
            <Text style={[
              size === 'sm' ? typography.label : typography.bodyMed,
              { color: variant === 'outline' || variant === 'ghost' ? theme.primary
                     : variant === 'danger'                         ? '#fff'
                     : '#fff',
                marginLeft: icon ? 8 : 0,
              }
            ]}>
              {title}
            </Text>
          </>
      }
    </>
  );

  return (
    <Animated.View style={[anim, style, isDisabled && { opacity: 0.5 }]}>
      <Pressable onPress={onPress} onPressIn={onIn} onPressOut={onOut}
        disabled={isDisabled} style={{ borderRadius: r, overflow: 'hidden' }}>
        {variant === 'primary' && (
          <LinearGradient colors={theme.primaryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.base, { height: h, borderRadius: r }]}>
            {content}
          </LinearGradient>
        )}
        {variant === 'secondary' && (
          <LinearGradient colors={theme.accentGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.base, { height: h, borderRadius: r }]}>
            {content}
          </LinearGradient>
        )}
        {variant === 'outline' && (
          <Animated.View style={[styles.base, { height: h, borderRadius: r,
            borderWidth: 1.5, borderColor: theme.primary, backgroundColor: 'transparent' }]}>
            {content}
          </Animated.View>
        )}
        {variant === 'ghost' && (
          <Animated.View style={[styles.base, { height: h, borderRadius: r,
            backgroundColor: theme.primaryGrad[0] + '18' }]}>
            {content}
          </Animated.View>
        )}
        {variant === 'danger' && (
          <Animated.View style={[styles.base, { height: h, borderRadius: r,
            backgroundColor: theme.danger }]}>
            {content}
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
});
