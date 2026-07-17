import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../constants/typography';

interface Props {
  onCapture: (uri: string) => void;
  disabled?: boolean;
  label?: string;
}

export function InspectionCamera({ onCapture, disabled, label = 'Take Photo' }: Props) {
  const { theme } = useTheme();
  const [busy, setBusy] = useState(false);

  const handlePress = async () => {
    setBusy(true);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Camera Required',
          'AssetHub needs camera access to capture property condition photos. Enable it in your device settings.',
          [{ text: 'OK' }],
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        onCapture(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open camera.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || busy}
      style={[styles.btn, { backgroundColor: theme.surface, borderColor: theme.primary }]}
    >
      <Ionicons name="camera-outline" size={22} color={disabled ? theme.textMuted : theme.primary} />
      <Text style={[typography.label, { color: disabled ? theme.textMuted : theme.primary }]}>
        {busy ? 'Opening camera...' : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
});
