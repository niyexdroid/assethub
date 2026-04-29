import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { typography } from '../../constants/typography';

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const translateY    = useRef(new Animated.Value(-60)).current;
  const prevOnline    = useRef(true);

  useEffect(() => {
    if (!isOnline) {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
    } else if (prevOnline.current === false) {
      Animated.timing(translateY, { toValue: -60, duration: 300, useNativeDriver: true }).start();
    }
    prevOnline.current = isOnline;
  }, [isOnline]);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
      <Text style={[typography.label, styles.text]}>No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    zIndex:          9999,
    backgroundColor: '#E53E3E',
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    paddingVertical: 10,
  },
  text: { color: '#fff' },
});
