import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../constants/typography';

interface Props {
  onPress: () => void;
  loading?: boolean;
  label?: string;
}

export function GoogleButton({ onPress, loading, label = 'Continue with Google' }: Props) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.75 : 1 },
      ]}
    >
      {loading
        ? <ActivityIndicator color={theme.textSecondary} />
        : <>
            <View style={styles.iconWrap}>
              <AntDesign name="google" size={20} color="#EA4335" />
            </View>
            <Text style={[typography.bodyMed, { color: theme.textPrimary, flex: 1, textAlign: 'center', marginRight: 28 }]}>
              {label}
            </Text>
          </>
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 28,
    alignItems: 'center',
  },
});
