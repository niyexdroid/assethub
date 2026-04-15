import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../constants/typography';

interface Props extends TextInputProps {
  label?:       string;
  error?:       string;
  hint?:        string;
  leftIcon?:    React.ReactNode;
  rightIcon?:   React.ReactNode;
  onRightPress?: () => void;
}

export function Input({ label, error, hint, leftIcon, rightIcon, onRightPress, style, ...props }: Props) {
  const { theme }   = useTheme();
  const [focused, setFocused] = useState(false);
  const progress    = useSharedValue(0);

  const onFocus = () => { setFocused(true);  progress.value = withTiming(1, { duration: 200 }); props.onFocus?.({} as any); };
  const onBlur  = () => { setFocused(false); progress.value = withTiming(0, { duration: 200 }); props.onBlur?.({} as any); };

  const borderAnim = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      progress.value, [0, 1],
      [error ? theme.danger : theme.border, error ? theme.danger : theme.primaryLight]
    ),
  }));

  return (
    <View style={[styles.wrapper, style as any]}>
      {label && (
        <Text style={[typography.label, { color: focused ? theme.primaryLight : theme.textSecondary, marginBottom: 6 }]}>
          {label}
        </Text>
      )}

      <Animated.View style={[styles.container, borderAnim, { backgroundColor: theme.surface }]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          {...props}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholderTextColor={theme.textMuted}
          style={[
            typography.body,
            styles.input,
            { color: theme.textPrimary, paddingLeft: leftIcon ? 0 : 16 },
          ]}
        />

        {rightIcon && (
          <Pressable onPress={onRightPress} style={styles.iconRight} hitSlop={8}>
            {rightIcon}
          </Pressable>
        )}
      </Animated.View>

      {(error || hint) && (
        <Text style={[typography.caption, { marginTop: 4,
          color: error ? theme.danger : theme.textMuted }]}>
          {error ?? hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:   { marginBottom: 16 },
  container: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, height: 52 },
  input:     { flex: 1, height: '100%', paddingRight: 16 },
  iconLeft:  { paddingHorizontal: 14 },
  iconRight: { paddingHorizontal: 14 },
});
