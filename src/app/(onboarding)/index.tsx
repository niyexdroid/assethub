import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn, FadeInDown, interpolate,
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';
import { typography } from '../../constants/typography';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id:       '1',
    lottie:   require('../../assets/animations/home.json'),
    title:    'Find Your\nPerfect Home',
    subtitle: 'Browse verified listings across Lagos. Photos, prices, and landlord ratings — all in one place.',
    gradient: ['#0A6E4E', '#0D1117'],
  },
  {
    id:       '2',
    lottie:   require('../../assets/animations/payment.json'),
    title:    'Pay Rent\nWithout Stress',
    subtitle: 'Digital rent payments with instant receipts. No more cash, no more disputes.',
    gradient: ['#F4A825', '#0D1117'],
  },
  {
    id:       '3',
    lottie:   require('../../assets/animations/roommate.json'),
    title:    'Find Your\nRoommate',
    subtitle: 'Students: match with compatible roommates based on habits, budget, and school. Zero awkwardness.',
    gradient: ['#58A6FF', '#0D1117'],
  },
];

export default function OnboardingScreen() {
  const { theme }       = useTheme();
  const [current, setCurrent] = useState(0);
  const flatRef         = useRef<FlatList>(null);

  const goNext = () => {
    if (current < slides.length - 1) {
      flatRef.current?.scrollToIndex({ index: current + 1, animated: true });
      setCurrent(current + 1);
    } else {
      router.replace('/(auth)/login');
    }
  };

  const skip = () => router.replace('/(auth)/login');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        ref={flatRef}
        data={slides}
        horizontal pagingEnabled scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {/* Gradient background glow */}
            <LinearGradient
              colors={[item.gradient[0] + '40', 'transparent']}
              style={styles.glow}
            />

            {/* Lottie animation */}
            <Animated.View entering={FadeIn.delay(100)} style={styles.lottieBg}>
              <LottieView
                source={item.lottie}
                autoPlay loop
                style={styles.lottie}
              />
            </Animated.View>

            {/* Text */}
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.textBlock}>
              <Text style={[typography.h1, { color: theme.textPrimary, marginBottom: 12 }]}>
                {item.title}
              </Text>
              <Text style={[typography.body, { color: theme.textSecondary, lineHeight: 24 }]}>
                {item.subtitle}
              </Text>
            </Animated.View>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === current ? theme.primaryLight : theme.border,
                width: i === current ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.actions}>
        <Button
          title={current === slides.length - 1 ? 'Get Started' : 'Next'}
          onPress={goNext}
          size="lg"
          style={{ flex: 1 }}
        />
        {current < slides.length - 1 && (
          <Button title="Skip" onPress={skip} variant="ghost" size="lg"
            style={{ marginLeft: 12, paddingHorizontal: 24 }} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide:     { width, flex: 1, paddingHorizontal: 28, paddingTop: 80, justifyContent: 'center' },
  glow:      { position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.5 },
  lottieBg:  { alignItems: 'center', marginBottom: 48 },
  lottie:    { width: 280, height: 280 },
  textBlock: { gap: 4 },
  dots:      { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 24 },
  dot:       { height: 8, borderRadius: 4 },
  actions:   { flexDirection: 'row', paddingHorizontal: 28, paddingBottom: 48 },
});
