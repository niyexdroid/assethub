import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '../../../hooks/useTheme';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { typography } from '../../../constants/typography';
import { complaintsService } from '../../../services/complaints.service';
import { tenanciesService } from '../../../services/tenancies.service';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const schema = z.object({
  title:       z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Please describe the issue in at least 20 characters'),
});
type FormData = z.infer<typeof schema>;

const CATEGORIES: { icon: IoniconsName; label: string }[] = [
  { icon: 'construct-outline',       label: 'Maintenance' },
  { icon: 'water-outline',           label: 'Plumbing'    },
  { icon: 'flash-outline',           label: 'Electricity' },
  { icon: 'shield-checkmark-outline',label: 'Security'    },
  { icon: 'volume-high-outline',     label: 'Noise'       },
  { icon: 'sparkles-outline',        label: 'Cleaning'    },
  { icon: 'chatbubble-outline',      label: 'Other'       },
];

const PRIORITIES = [
  { value: 'low',    label: 'Low',    color: '#4ADE80', desc: 'Can wait a few days'    },
  { value: 'medium', label: 'Medium', color: '#FFA040', desc: 'Needs attention soon'   },
  { value: 'high',   label: 'High',   color: '#FF6B6B', desc: 'Urgent — disrupts life' },
];

export default function NewComplaintScreen() {
  const { theme } = useTheme();
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading]   = useState(false);
  const [catError, setCatError] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!category) { setCatError('Please select a category'); return; }
    setLoading(true);
    try {
      const tenancies = await tenanciesService.getTenantTenancies();
      const active    = tenancies.find(t => t.status === 'active');
      if (!active) {
        Alert.alert('No active tenancy', 'You need an active tenancy to file a complaint.');
        return;
      }
      await complaintsService.create({
        tenancy_id:  active.id,
        category,
        title:       data.title,
        description: data.description,
        priority,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not submit complaint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          <Text style={[typography.h2, { color: theme.textPrimary }]}>New Complaint</Text>
          <Text style={[typography.small, { color: theme.textMuted }]}>
            Your landlord will be notified immediately
          </Text>
        </Animated.View>

        {/* Category picker */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.section}>
          <Text style={[typography.label, { color: theme.textMuted, marginBottom: 10 }]}>CATEGORY</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(c => {
              const active = category === c.label;
              return (
                <Pressable
                  key={c.label}
                  onPress={() => { setCategory(c.label); setCatError(''); }}
                  style={[styles.categoryBtn, {
                    backgroundColor: active ? theme.primary + '22' : theme.surface,
                    borderColor:     active ? theme.primary : theme.border,
                  }]}
                >
                  <Ionicons name={c.icon} size={24} color={active ? theme.primary : theme.textSecondary} />
                  <Text style={[typography.caption, { color: active ? theme.primary : theme.textSecondary, marginTop: 4, textAlign: 'center' }]}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {catError ? <Text style={[typography.caption, { color: theme.danger, marginTop: 4 }]}>{catError}</Text> : null}
        </Animated.View>

        {/* Priority picker */}
        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.section}>
          <Text style={[typography.label, { color: theme.textMuted, marginBottom: 10 }]}>PRIORITY LEVEL</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map(p => {
              const active = priority === p.value;
              return (
                <Pressable
                  key={p.value}
                  onPress={() => setPriority(p.value)}
                  style={[styles.priorityBtn, {
                    backgroundColor: active ? p.color + '22' : theme.surface,
                    borderColor:     active ? p.color : theme.border,
                    flex: 1,
                  }]}
                >
                  <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                  <Text style={[typography.bodyMed, { color: active ? p.color : theme.textPrimary }]}>{p.label}</Text>
                  <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center', marginTop: 2 }]} numberOfLines={2}>
                    {p.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.form}>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Issue Title"
                placeholder="e.g. AC not working in bedroom"
                value={value}
                onChangeText={onChange}
                error={errors.title?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Detailed Description"
                placeholder="Describe the issue, when it started, and how it affects you..."
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={5}
                error={errors.description?.message}
              />
            )}
          />

          {/* Info notice */}
          <View style={[styles.notice, { backgroundColor: theme.surface, borderColor: theme.primaryLight + '44' }]}>
            <Ionicons name="information-circle-outline" size={18} color={theme.primaryLight} style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={[typography.small, { color: theme.textSecondary, flex: 1, lineHeight: 18 }]}>
              Your landlord will receive a WhatsApp and push notification. If unresolved in 48h, it auto-escalates to admin.
            </Text>
          </View>

          <Button title="Submit Complaint" onPress={handleSubmit(onSubmit)} size="lg" loading={loading} />
          <Button title="Cancel" onPress={() => router.back()} variant="ghost" size="lg" />
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { padding: 24, paddingTop: 60, paddingBottom: 40 },
  header:       { marginBottom: 28 },
  section:      { marginBottom: 24 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryBtn:  { width: '28%', borderRadius: 14, borderWidth: 1.5, paddingVertical: 12, alignItems: 'center' },
  priorityRow:  { flexDirection: 'row', gap: 10 },
  priorityBtn:  { borderRadius: 14, borderWidth: 1.5, padding: 12, alignItems: 'center', gap: 4 },
  priorityDot:  { width: 10, height: 10, borderRadius: 5 },
  form:         { gap: 16 },
  notice:       { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 12, borderWidth: 1, padding: 12 },
});
