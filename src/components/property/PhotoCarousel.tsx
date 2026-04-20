import React, { useState } from 'react';
import { Dimensions, FlatList, Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

const { width, height } = Dimensions.get('window');

function ZoomModal({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  const scale      = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX     = useSharedValue(0);
  const savedY     = useSharedValue(0);

  const reset = () => {
    scale.value      = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedX.value     = 0;
    savedY.value     = 0;
  };

  const pinch = Gesture.Pinch()
    .onUpdate(e => { scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 5)); })
    .onEnd(() => { savedScale.value = scale.value; });

  const pan = Gesture.Pan()
    .onUpdate(e => {
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) { reset(); }
      else { scale.value = withTiming(2.5); savedScale.value = 2.5; }
    });

  const imgStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={() => { reset(); onClose(); }}>
      <GestureHandlerRootView style={styles.zoomOverlay}>
        <Pressable style={styles.zoomClose} onPress={() => { reset(); onClose(); }}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
          <Animated.Image
            source={uri ? { uri } : undefined}
            style={[styles.zoomImage, imgStyle]}
            resizeMode="contain"
          />
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

interface Props {
  photos: string[];
  height: number;
  gradientEnd: string;
}

export function PhotoCarousel({ photos, height: imgHeight, gradientEnd }: Props) {
  const { theme } = useTheme();
  const [index, setIndex]       = useState(0);
  const [zoomUri, setZoomUri]   = useState<string | null>(null);

  if (!photos?.length) {
    return (
      <View style={[styles.placeholder, { height: imgHeight, backgroundColor: theme.surfaceRaised }]}>
        <Ionicons name="home-outline" size={72} color={theme.textMuted} />
      </View>
    );
  }

  return (
    <View style={{ height: imgHeight }}>
      <FlatList
        data={photos}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <Pressable onPress={() => setZoomUri(item)}>
            <Image source={{ uri: item }} style={{ width, height: imgHeight }} resizeMode="cover" />
          </Pressable>
        )}
      />
      {photos.length > 1 && (
        <View style={styles.dots}>
          {photos.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.4)', width: i === index ? 16 : 6 }]} />
          ))}
        </View>
      )}
      <LinearGradient colors={['transparent', gradientEnd]} style={styles.gradient} />
      <ZoomModal uri={zoomUri} onClose={() => setZoomUri(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  dots:        { position: 'absolute', bottom: 100, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  dot:         { height: 6, borderRadius: 3 },
  gradient:    { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  zoomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  zoomClose:   { position: 'absolute', top: 52, right: 20, zIndex: 10, padding: 8 },
  zoomImage:   { width, height },
});
