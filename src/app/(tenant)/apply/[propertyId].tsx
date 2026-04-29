import React, { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../hooks/useTheme';
import { Button } from '../../../components/ui/Button';
import { typography } from '../../../constants/typography';
import { tenanciesService } from '../../../services/tenancies.service';
import { propertiesService, Property } from '../../../services/properties.service';
import { formatNGN } from '../../../utils/format';

function OptionPill({ label, selected, onPress, theme }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, {
        backgroundColor: selected ? theme.primary : theme.surface,
        borderColor:     selected ? theme.primary : theme.border,
      }]}
    >
      <Text style={[typography.small, { color: selected ? '#fff' : theme.textSecondary, fontWeight: selected ? '700' : '400' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function ApplyScreen() {
  const { theme }        = useTheme();
  const { propertyId }   = useLocalSearchParams<{ propertyId: string }>();
  const [property, setProperty]         = useState<Property | null>(null);
  const [tenancyType, setTenancyType]   = useState<'monthly' | 'yearly'>('yearly');
  const [moveInDate, setMoveInDate]     = useState('');
  const [message, setMessage]           = useState('');
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    if (propertyId) {
      propertiesService.getById(propertyId).then(setProperty).catch(() => {});
    }
  }, [propertyId]);

  const onSubmit = async () => {
    if (!moveInDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Invalid Date', 'Enter move-in date in YYYY-MM-DD format.');
      return;
    }
    setLoading(true);
    try {
      await tenanciesService.apply({
        property_id:  propertyId,
        tenancy_type: tenancyType,
        move_in_date: moveInDate,
        message:      message.trim() || undefined,
      });
      Alert.alert(
        'Application Sent!',
        'Your application has been sent to the landlord. You\'ll be notified once they review it.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not submit application.');
    } finally {
      setLoading(false);
    }
  };

  const p = property;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
        </Pressable>
        <Text style={[typography.h4, { color: theme.textPrimary }]}>Apply for Property</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Property summary */}
        {p && (
          <Animated.View entering={FadeInDown.delay(0).springify()} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[typography.bodyMed, { color: theme.textPrimary }]} numberOfLines={2}>{p.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Ionicons name="location-outline" size={13} color={theme.textMuted} />
              <Text style={[typography.caption, { color: theme.textMuted }]}>{p.address}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
              {p.monthly_rent && (
                <View>
                  <Text style={[typography.caption, { color: theme.textMuted }]}>Monthly</Text>
                  <Text style={[typography.bodyMed, { color: theme.primary }]}>{formatNGN(Number(p.monthly_rent))}</Text>
                </View>
              )}
              {p.yearly_rent && (
                <View>
                  <Text style={[typography.caption, { color: theme.textMuted }]}>Yearly</Text>
                  <Text style={[typography.bodyMed, { color: theme.primary }]}>{formatNGN(Number(p.yearly_rent))}</Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Tenancy type */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.section}>
          <Text style={[typography.label, { color: theme.textMuted, marginBottom: 10 }]}>RENT PAYMENT TYPE</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <OptionPill label="Yearly" selected={tenancyType === 'yearly'} onPress={() => setTenancyType('yearly')} theme={theme} />
            <OptionPill label="Monthly" selected={tenancyType === 'monthly'} onPress={() => setTenancyType('monthly')} theme={theme} />
          </View>
          <Text style={[typography.caption, { color: theme.textMuted, marginTop: 8 }]}>
            {tenancyType === 'yearly'
              ? 'Yearly payment is common in Lagos — usually required upfront.'
              : 'Monthly payment if the landlord accepts it.'}
          </Text>
        </Animated.View>

        {/* Move-in date */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
          <Text style={[typography.label, { color: theme.textMuted, marginBottom: 8 }]}>PREFERRED MOVE-IN DATE</Text>
          <TextInput
            value={moveInDate}
            onChangeText={setMoveInDate}
            placeholder="YYYY-MM-DD  e.g. 2026-05-01"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
            keyboardType="numeric"
          />
        </Animated.View>

        {/* Message */}
        <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.section}>
          <Text style={[typography.label, { color: theme.textMuted, marginBottom: 8 }]}>MESSAGE TO LANDLORD <Text style={{ color: theme.textMuted, fontWeight: '400' }}>(optional)</Text></Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Introduce yourself — occupation, number of occupants, references..."
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textarea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
          />
        </Animated.View>

        {/* Info */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={[styles.infoBox, { backgroundColor: theme.primary + '12', borderColor: theme.primary + '30' }]}>
          <Ionicons name="information-circle-outline" size={16} color={theme.primary} />
          <Text style={[typography.caption, { color: theme.primary, flex: 1 }]}>
            The landlord will review your application and contact you. You'll get a notification once a decision is made.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).springify()} style={{ gap: 12 }}>
          <Button title="Submit Application" onPress={onSubmit} loading={loading} size="lg" />
          <Button title="Cancel" onPress={() => router.back()} variant="ghost" size="lg" />
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn:  { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  scroll:   { padding: 20, gap: 24, paddingBottom: 40 },
  card:     { borderRadius: 14, borderWidth: 1, padding: 16 },
  section:  {},
  input:    { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textarea: { height: 100, textAlignVertical: 'top' },
  infoBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12 },
  pill:     { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
});
