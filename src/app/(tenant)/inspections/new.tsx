import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../../hooks/useTheme';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { InspectionItem } from '../../../components/inspection/InspectionItem';
import { InspectionCamera } from '../../../components/inspection/InspectionCamera';
import { typography } from '../../../constants/typography';
import { tenanciesService, Tenancy } from '../../../services/tenancies.service';
import { inspectionsService } from '../../../services/inspections.service';
import { CONDITION_OPTIONS } from '../../../types/inspections';
import type { InspectionItem as InspectionItemType } from '../../../types/inspections';

function condIcon(condition: string): string {
  const opt = CONDITION_OPTIONS.find(o => o.value === condition);
  return (opt?.icon ?? 'help-circle-outline') as string;
}

export default function NewInspectionScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isOnline } = useNetworkStatus();
  const { tenancyId: paramTenancyId } = useLocalSearchParams<{ tenancyId?: string }>();

  // Tenancy selection
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [loadingTenancies, setLoadingTenancies] = useState(true);
  const [selectedTenancyId, setSelectedTenancyId] = useState(paramTenancyId ?? '');

  // Report
  const [reportId, setReportId] = useState<string | null>(null);
  const [items, setItems] = useState<InspectionItemType[]>([]);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add-item form
  const [formName, setFormName] = useState('');
  const [formCondition, setFormCondition] = useState('good');
  const [formNotes, setFormNotes] = useState('');
  const [formPhotoUri, setFormPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formExpanded, setFormExpanded] = useState(false);

  // Load active tenancies
  useEffect(() => {
    (async () => {
      try {
        const list = await tenanciesService.getTenantTenancies();
        setTenancies(list.filter(t => t.status === 'active'));
      } catch { /* ignore */ }
      finally { setLoadingTenancies(false); }
    })();
  }, []);

  // Create report once tenancy selected
  const createReport = useCallback(async (tId: string) => {
    setCreating(true);
    try {
      const report = await inspectionsService.create(tId);
      setReportId(report.id);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not create inspection report.');
      setSelectedTenancyId('');
    } finally {
      setCreating(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTenancyId && !reportId) {
      createReport(selectedTenancyId);
    }
  }, [selectedTenancyId, reportId, createReport]);

  // Add item
  const handleAddItem = async () => {
    if (!formName.trim()) {
      Alert.alert('Required', 'Enter a name for the item.');
      return;
    }
    if (!reportId) return;

    setUploading(true);
    try {
      let photoUrl: string | null = null;
      if (formPhotoUri) {
        photoUrl = await inspectionsService.uploadPhoto(formPhotoUri);
      }

      const item = await inspectionsService.addItem(reportId, {
        item_name: formName.trim(),
        condition: formCondition,
        notes: formNotes.trim() || undefined,
        photo_urls: photoUrl ? [photoUrl] : [],
        capture_source: 'camera',
        captured_at: new Date().toISOString(),
      });

      setItems(prev => [...prev, item]);
      setFormName('');
      setFormCondition('good');
      setFormNotes('');
      setFormPhotoUri(null);
      setFormExpanded(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not add item.');
    } finally {
      setUploading(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId: string, index: number) => {
    if (!reportId) return;
    try {
      await inspectionsService.deleteItem(reportId, itemId);
      setItems(prev => prev.filter((_, i) => i !== index));
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not delete item.');
    }
  };

  // Submit
  const handleSubmit = async () => {
    if (!reportId) return;
    if (!items.length) {
      Alert.alert('No Items', 'Add at least one item before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await inspectionsService.submit(reportId);
      router.replace(`/(shared)/inspections/${reportId}`);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not submit inspection.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTenancy = tenancies.find(t => t.id === selectedTenancyId);

  // ── Loading tenancies ──
  if (loadingTenancies) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // ── Select tenancy step ──
  if (!selectedTenancyId || !reportId) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Ionicons name="chevron-back" size={20} color={theme.primaryLight} />
          <Text style={[typography.label, { color: theme.primaryLight }]}>Tenancy</Text>
        </Pressable>

        <Text style={[typography.h3, { color: theme.textPrimary, marginTop: 20, marginBottom: 4 }]}>
          New Inspection
        </Text>
        <Text style={[typography.small, { color: theme.textMuted, marginBottom: 20 }]}>
          Select the tenancy you want to inspect.
        </Text>

        {tenancies.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="home-outline" size={48} color={theme.textMuted} />
            <Text style={[typography.bodyMed, { color: theme.textMuted, marginTop: 12, textAlign: 'center' }]}>
              No active tenancies. Start a tenancy first.
            </Text>
          </View>
        ) : (
          tenancies.map((t, i) => (
            <Animated.View key={t.id} entering={FadeInDown.delay(i * 60).springify()}>
              <Pressable
                onPress={() => setSelectedTenancyId(t.id)}
                style={[styles.tenancyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>{t.property_title}</Text>
                  <Text style={[typography.caption, { color: theme.textMuted, marginTop: 2 }]}>
                    {t.property_address ?? t.address}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </Pressable>
            </Animated.View>
          ))
        )}

        {creating && (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <ActivityIndicator color={theme.primary} />
            <Text style={[typography.small, { color: theme.textMuted, marginTop: 8 }]}>Creating report...</Text>
          </View>
        )}
      </ScrollView>
    );
  }

  // ── Add items step ──
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Ionicons name="chevron-back" size={20} color={theme.primaryLight} />
          <Text style={[typography.label, { color: theme.primaryLight }]}>Tenancy</Text>
        </Pressable>

        {/* Header */}
        <Text style={[typography.h3, { color: theme.textPrimary, marginTop: 20, marginBottom: 2 }]}>
          Inspection Items
        </Text>
        <Text style={[typography.small, { color: theme.textMuted, marginBottom: 4 }]}>
          {selectedTenancy?.property_title ?? 'Property'} — document condition of each item
        </Text>

        {!isOnline && (
          <View style={[styles.offlineNote, { backgroundColor: theme.warning + '18', borderColor: theme.warning }]}>
            <Ionicons name="cloud-offline-outline" size={16} color={theme.warning} />
            <Text style={[typography.caption, { color: theme.warning }]}>Offline — photos will be uploaded when you're back online</Text>
          </View>
        )}

        {/* Add-item form */}
        {formExpanded ? (
          <Animated.View
            entering={FadeInDown.springify()}
            style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Text style={[typography.label, { color: theme.textMuted, marginBottom: 12 }]}>NEW ITEM</Text>

            {/* Name */}
            <Input
              placeholder='e.g. "Living Room Paint", "Kitchen Sink"'
              value={formName}
              onChangeText={setFormName}
              leftIcon={<Ionicons name="cube-outline" size={18} color={theme.textMuted} />}
            />

            {/* Condition picker */}
            <Text style={[typography.caption, { color: theme.textMuted, marginTop: 14, marginBottom: 8 }]}>Condition</Text>
            <View style={styles.condRow}>
              {CONDITION_OPTIONS.map(opt => {
                const active = formCondition === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setFormCondition(opt.value)}
                    style={[
                      styles.condBtn,
                      {
                        backgroundColor: active ? theme.primary + '18' : theme.background,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={18}
                      color={active ? theme.primary : theme.textMuted}
                    />
                    <Text style={[typography.caption, { color: active ? theme.primary : theme.textMuted }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Camera */}
            <View style={{ marginTop: 14 }}>
              <InspectionCamera
                onCapture={setFormPhotoUri}
                disabled={uploading}
                label={formPhotoUri ? 'Retake Photo' : 'Take Photo'}
              />
              {formPhotoUri && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                  <Text style={[typography.caption, { color: theme.success }]}>Photo captured</Text>
                </View>
              )}
            </View>

            {/* Notes */}
            <View style={{ marginTop: 14 }}>
              <Input
                placeholder="Any additional notes (optional)"
                value={formNotes}
                onChangeText={setFormNotes}
                leftIcon={<Ionicons name="create-outline" size={18} color={theme.textMuted} />}
              />
            </View>

            {/* Form actions */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Button
                title="Add Item"
                onPress={handleAddItem}
                loading={uploading}
                size="sm"
                style={{ flex: 1 }}
              />
              <Button
                title="Cancel"
                onPress={() => { setFormExpanded(false); setFormPhotoUri(null); setFormName(''); setFormNotes(''); }}
                variant="outline"
                size="sm"
              />
            </View>
          </Animated.View>
        ) : (
          <Button
            title="+ Add Item"
            onPress={() => setFormExpanded(true)}
            variant="outline"
            size="lg"
            style={{ marginTop: 20, marginBottom: 8 }}
          />
        )}

        {/* Items list */}
        {items.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="clipboard-outline" size={48} color={theme.textMuted} />
            <Text style={[typography.bodyMed, { color: theme.textMuted, marginTop: 12, textAlign: 'center' }]}>
              No items yet. Start by adding items like walls, floors, appliances, and fixtures.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 20 }}>
            <Text style={[typography.label, { color: theme.textMuted, marginBottom: 4 }]}>
              {items.length} {items.length === 1 ? 'ITEM' : 'ITEMS'}
            </Text>
            {items.map((item, i) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(i * 40).springify()}>
                <InspectionItem
                  item={item}
                  onDelete={() => handleDeleteItem(item.id, i)}
                />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom submit bar */}
      {items.length > 0 && (
        <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderColor: theme.border, paddingBottom: insets.bottom + 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>{items.length} items</Text>
            <Text style={[typography.caption, { color: theme.textMuted }]}>Ready to submit for review</Text>
          </View>
          <Button
            title="Submit for Review"
            onPress={handleSubmit}
            loading={submitting}
            size="md"
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 0,
  },
  tenancyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 10,
  },
  offlineNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    marginTop: 12,
    marginBottom: 4,
  },
  formCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginTop: 16,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  condRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  condBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
