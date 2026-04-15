import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { Badge }  from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { typography } from '../../../constants/typography';
import { complaintsService, Complaint } from '../../../services/complaints.service';

const STATUS_BADGE: Record<string, { variant: 'danger' | 'warning' | 'success' | 'info'; label: string }> = {
  open:        { variant: 'danger',  label: 'Open'        },
  in_progress: { variant: 'warning', label: 'In Progress' },
  resolved:    { variant: 'success', label: 'Resolved'    },
  escalated:   { variant: 'info',    label: 'Escalated'   },
};

export default function LandlordComplaintDetailScreen() {
  const { theme }  = useTheme();
  const insets     = useSafeAreaInsets();
  const { id }     = useLocalSearchParams<{ id: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading]     = useState(true);
  const [resolving, setResolving] = useState(false);
  const [escalating, setEscalating] = useState(false);

  useEffect(() => {
    if (!id) return;
    complaintsService.getById(id).then(setComplaint).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleResolve = async () => {
    if (!id) return;
    setResolving(true);
    try {
      await complaintsService.resolve(id, 'Resolved by landlord');
      setComplaint(prev => prev ? { ...prev, status: 'resolved' } : prev);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not resolve complaint.');
    } finally { setResolving(false); }
  };

  const handleEscalate = async () => {
    if (!id) return;
    setEscalating(true);
    try {
      await complaintsService.escalate(id);
      setComplaint(prev => prev ? { ...prev, status: 'escalated' } : prev);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not escalate complaint.');
    } finally { setEscalating(false); }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[typography.body, { color: theme.textMuted }]}>Complaint not found.</Text>
      </View>
    );
  }

  const statusBadge = STATUS_BADGE[complaint.status] ?? STATUS_BADGE.open;
  const isResolved  = complaint.status === 'resolved';
  const isEscalated = complaint.status === 'escalated';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        <Ionicons name="chevron-back" size={20} color={theme.primaryLight} />
        <Text style={[typography.label, { color: theme.primaryLight }]}>Complaints</Text>
      </Pressable>

      {/* Title card */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <Text style={[typography.h3, { color: theme.textPrimary, flex: 1, marginRight: 12 }]}>{complaint.title}</Text>
          <Badge label={statusBadge.label} variant={statusBadge.variant} />
        </View>
        <Text style={[typography.body, { color: theme.textSecondary, lineHeight: 22 }]}>{complaint.description}</Text>
        <View style={[styles.tagRow, { marginTop: 14 }]}>
          {[
            { icon: 'home-outline' as const,       text: complaint.property_title ?? 'Property' },
            { icon: 'calendar-outline' as const,   text: new Date(complaint.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) },
            { icon: 'construct-outline' as const,  text: complaint.category   },
            { icon: 'flag-outline' as const,       text: complaint.priority   },
          ].map((t, i) => (
            <View key={i} style={[styles.tag, { backgroundColor: theme.background }]}>
              <Ionicons name={t.icon} size={12} color={theme.textMuted} />
              <Text style={[typography.caption, { color: theme.textSecondary }]}>{t.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={{ gap: 10, marginTop: 20 }}>
        {!isResolved && (
          <Button title="Mark as Resolved" onPress={handleResolve} size="lg" loading={resolving} />
        )}
        {!isEscalated && !isResolved && (
          <Button title="Escalate to Admin" onPress={handleEscalate} variant="outline" size="lg" loading={escalating} />
        )}
        <Button title="Back" onPress={() => router.back()} variant="ghost" size="lg" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card:    { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  tagRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
});
