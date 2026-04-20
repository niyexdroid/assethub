import React, { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { typography } from '../../../constants/typography';
import { roommatesService } from '../../../services/roommates.service';

const SLEEP_OPTIONS  = [
  { label: 'Early Bird',  value: 'early_bird' },
  { label: 'Night Owl',   value: 'night_owl'  },
  { label: 'Flexible',    value: 'flexible'   },
];
const CLEAN_OPTIONS  = [
  { label: 'Very Clean',  value: 'very_clean' },
  { label: 'Clean',       value: 'clean'      },
  { label: 'Relaxed',     value: 'relaxed'    },
];
const NOISE_OPTIONS  = [
  { label: 'Quiet',       value: 'quiet'      },
  { label: 'Moderate',    value: 'moderate'   },
  { label: 'Lively',      value: 'lively'     },
];
const GENDER_OPTIONS = [
  { label: 'Male',        value: 'male'       },
  { label: 'Female',      value: 'female'     },
  { label: 'Any',         value: 'any'        },
];

function OptionChip({ label, selected, onPress, theme }: { label: string; selected: boolean; onPress: () => void; theme: any }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, {
        backgroundColor: selected ? theme.primary + '22' : theme.surface,
        borderColor:     selected ? theme.primary : theme.border,
      }]}
    >
      <Text style={[typography.small, { color: selected ? theme.primary : theme.textSecondary, fontWeight: selected ? '700' : '400' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function RoommateProfileScreen() {
  const { theme }  = useTheme();
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading]   = useState(false);
  const [budget,   setBudget]   = useState('');
  const [bio,      setBio]      = useState('');
  const [sleep,    setSleep]    = useState('');
  const [clean,    setClean]    = useState('');
  const [noise,    setNoise]    = useState('');
  const [gender,   setGender]   = useState('Any');

  // Load existing profile on mount
  useEffect(() => {
    roommatesService.getProfile().then(profile => {
      if (profile) {
        setBudget(String(profile.budget_max ?? ''));
        setBio(profile.bio ?? '');
        setGender(profile.gender_preference ?? profile.gender ?? 'any');
        if (profile.sleep_schedule)  setSleep(profile.sleep_schedule);
        if (profile.cleanliness)     setClean(profile.cleanliness);
        if (profile.noise_tolerance) setNoise(profile.noise_tolerance);
      }
    }).catch(() => {}).finally(() => setInitialLoading(false));
  }, []);

  const onSave = async () => {
    setLoading(true);
    try {
      await roommatesService.upsertProfile({
        budget_min: 0,
        budget_max: budget ? Number(budget) : 0,
        gender_preference: gender as any,
        sleep_schedule:    sleep   as any || undefined,
        cleanliness:       clean   as any || undefined,
        noise_tolerance:   noise   as any || undefined,
        bio: bio || undefined,
        is_active: true,
      });
      Alert.alert('Profile Saved', 'Your roommate profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not save profile.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          <LinearGradient colors={theme.primaryGrad} style={styles.avatarRing}>
            <Ionicons name="person" size={42} color="#fff" />
          </LinearGradient>
          <Text style={[typography.h2, { color: theme.textPrimary, marginTop: 14 }]}>Roommate Profile</Text>
          <Text style={[typography.small, { color: theme.textMuted, textAlign: 'center', marginTop: 4 }]}>
            Better profile = better matches. Be honest!
          </Text>
        </Animated.View>

        {/* Budget */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.section}>
          <Input
            label="Monthly Rent Budget (₦)"
            placeholder="e.g. 45000"
            value={budget}
            onChangeText={setBudget}
            keyboardType="number-pad"
            leftIcon={<Ionicons name="cash-outline" size={18} color={theme.textMuted} />}
            hint="Your max monthly rent contribution"
          />
        </Animated.View>

        {/* Gender preference */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
          <Text style={[typography.label, { color: theme.textMuted, marginBottom: 10 }]}>ROOMMATE GENDER PREFERENCE</Text>
          <View style={styles.chips}>
            {GENDER_OPTIONS.map(g => <OptionChip key={g.value} label={g.label} selected={gender === g.value} onPress={() => setGender(g.value)} theme={theme} />)}
          </View>
        </Animated.View>

        {/* Sleep schedule */}
        <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Ionicons name="moon-outline" size={13} color={theme.textMuted} />
            <Text style={[typography.label, { color: theme.textMuted }]}>SLEEP SCHEDULE</Text>
          </View>
          <View style={styles.chips}>
            {SLEEP_OPTIONS.map(s => <OptionChip key={s.value} label={s.label} selected={sleep === s.value} onPress={() => setSleep(s.value)} theme={theme} />)}
          </View>
        </Animated.View>

        {/* Cleanliness */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Ionicons name="sparkles-outline" size={13} color={theme.textMuted} />
            <Text style={[typography.label, { color: theme.textMuted }]}>CLEANLINESS</Text>
          </View>
          <View style={styles.chips}>
            {CLEAN_OPTIONS.map(c => <OptionChip key={c.value} label={c.label} selected={clean === c.value} onPress={() => setClean(c.value)} theme={theme} />)}
          </View>
        </Animated.View>

        {/* Noise level */}
        <Animated.View entering={FadeInDown.delay(220).springify()} style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Ionicons name="volume-medium-outline" size={13} color={theme.textMuted} />
            <Text style={[typography.label, { color: theme.textMuted }]}>NOISE LEVEL</Text>
          </View>
          <View style={styles.chips}>
            {NOISE_OPTIONS.map(n => <OptionChip key={n.value} label={n.label} selected={noise === n.value} onPress={() => setNoise(n.value)} theme={theme} />)}
          </View>
        </Animated.View>

        {/* Bio */}
        <Animated.View entering={FadeInDown.delay(260).springify()} style={styles.section}>
          <Input
            label="Short Bio"
            placeholder="A little about yourself — interests, lifestyle, study habits..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            hint="Keep it friendly and honest"
          />
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.actions}>
          <Button title="Save Profile" onPress={onSave} size="lg" loading={loading} />
          <Button title="Cancel" onPress={() => router.back()} variant="ghost" size="lg" />
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { padding: 24, paddingTop: 60, paddingBottom: 40 },
  header:     { alignItems: 'center', marginBottom: 28 },
  avatarRing: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  section:    { marginBottom: 22 },
  chips:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  actions:    { gap: 12 },
});
