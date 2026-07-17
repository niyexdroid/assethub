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
import { useOfflineQueue, type DraftItem } from '../../../hooks/useOfflineQueue';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { InspectionItem } from '../../../components/inspection/InspectionItem';
import { InspectionCamera } from '../../../components/inspection/InspectionCamera';
import { typography } from '../../../constants/typography';
import { tenanciesService, Tenancy } from '../../../services/tenancies.service';
import { inspectionsService } from '../../../services/inspections.service';
import { CONDITION_OPTIONS } from '../../../types/inspections';
import type { InspectionItem as InspectionItemType } from '../../../types/inspections';

let _offlineId = 0;
function offlineLocalId(): string {
  _offlineId++;
  return `draft_${Date.now().toString(36)}_${_offlineId}`;
}

export default function NewInspectionScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isOnline } = useNetworkStatus();
  const { enqueue, pendingCount, isProcessing: isProcessingQueue, progress: queueProgress } = useOfflineQueue();
  const { tenancyId: paramTenancyId } = useLocalSearchParams<{ tenancyId?: string }>();

  // Tenancy selection
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [tenancyError, setTenancyError] = useState('');
  const [loadingTenancies, setLoadingTenancies] = useState(true);
  const [selectedTenancyId, setSelectedTenancyId] = useState(paramTenancyId ?? '');

  // Report
  const [reportId, setReportId] = useState<string | null>(null);
  const [items, setItems] = useState<InspectionItemType[]>([]);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Offline state
  const [offlineTenancy, setOfflineTenancy] = useState<{ id: string; label: string } | null>(null);
  const [offlineItems, setOfflineItems] = useState<DraftItem[]>([]);
  const [draftSaved, setDraftSaved] = useState(false);

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
      } catch { setTenancyError('Could not load tenancies.'); }
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
  const handleDeleteItem = async (itemId: string) => {
    if (!reportId) return;
    try {
      await inspectionsService.deleteItem(reportId, itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));
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

  // ── Offline handlers ───────────────────────────────────────────

  const handleAddOfflineItem = () => {
    if (!formName.trim()) {
      Alert.alert('Required', 'Enter a name for the item.');
      return;
    }
    const item: DraftItem = {
      localId: offlineLocalId(),
      itemName: formName.trim(),
      condition: formCondition,
      notes: formNotes.trim() || undefined,
      photoUri: formPhotoUri,
      capturedAt: new Date().toISOString(),
    };
    setOfflineItems(prev => [...prev, item]);
    setFormName('');
    setFormCondition('good');
    setFormNotes('');
    setFormPhotoUri(null);
    setFormExpanded(false);
  };

  const handleDeleteOfflineItem = (localId: string) => {
    setOfflineItems(prev => prev.filter(i => i.localId !== localId));
  };

  const handleSaveDraft = async () => {
    if (!offlineTenancy) return;
    if (!offlineItems.length) {
      Alert.alert('No Items', 'Add at least one item before saving.');
      return;
    }
    await enqueue({
      tenancyId: offlineTenancy.id,
      tenancyLabel: offlineTenancy.label,
      items: offlineItems,
    });
    setOfflineItems([]);
    setOfflineTenancy(null);
    setDraftSaved(true);
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
  const hasOfflineSession = !!offlineTenancy || offlineItems.length > 0;
  const showTenancySelect = isOnline
    ? (!selectedTenancyId || !reportId) && !hasOfflineSession
    : (!offlineTenancy && !draftSaved);

  if (showTenancySelect && !isProcessingQueue) {
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
            <Ionicons name={tenancyError ? 'cloud-offline-outline' : 'home-outline'} size={48} color={theme.textMuted} />
            <Text style={[typography.bodyMed, { color: theme.textMuted, marginTop: 12, textAlign: 'center' }]}>
              {tenancyError || 'No active tenancies. Start a tenancy first.'}
            </Text>
          </View>
        ) : (
          tenancies.map((t, i) => (
            <Animated.View key={t.id} entering={FadeInDown.delay(i * 60).springify()}>
              <Pressable
                onPress={() => {
                  if (!isOnline) {
                    setOfflineTenancy({ id: t.id, label: t.property_title ?? t.property_address ?? 'Property' });
                  } else {
                    setSelectedTenancyId(t.id);
                  }
                }}
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

  // ── Queue processing screen ──
  if (isProcessingQueue) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[typography.h3, { color: theme.textPrimary, marginTop: 20 }]}>Syncing drafts...</Text>
        {queueProgress && (
          <Text style={[typography.bodyMed, { color: theme.textMuted, marginTop: 8, textAlign: 'center' }]}>
            {queueProgress.label}{'\n'}
            Draft {queueProgress.current} of {queueProgress.total}
          </Text>
        )}
        <Text style={[typography.caption, { color: theme.textMuted, marginTop: 12 }]}>
          Please wait while we upload your saved inspections.
        </Text>
      </View>
    );
  }

  // ── Draft saved screen ──
  if (draftSaved && !offlineTenancy && !isOnline) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Ionicons name="cloud-done-outline" size={56} color={theme.success} />
        <Text style={[typography.h3, { color: theme.textPrimary, marginTop: 16 }]}>Draft Saved</Text>
        <Text style={[typography.bodyMed, { color: theme.textMuted, marginTop: 8, textAlign: 'center' }]}>
          Your inspection will be uploaded automatically when you're back online.
        </Text>
        {pendingCount > 0 && (
          <Text style={[typography.small, { color: theme.primary, marginTop: 12 }]}>
            {pendingCount} draft{pendingCount !== 1 ? 's' : ''} pending
          </Text>
        )}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
          <Button
            title="Create Another"
            onPress={() => setDraftSaved(false)}
            variant="outline"
            size="md"
          />
          <Button
            title="Back to Tenancy"
            onPress={() => router.back()}
            size="md"
          />
        </View>
      </View>
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
        <Pressable
          onPress={() => {
            if (!isOnline && offlineTenancy) {
              if (offlineItems.length > 0) {
                Alert.alert('Discard Items?', `You have ${offlineItems.length} unsaved item${offlineItems.length !== 1 ? 's' : ''}. Going back will discard them.`, [
                  { text: 'Keep Editing', style: 'cancel' },
                  { text: 'Discard', style: 'destructive', onPress: () => { setOfflineTenancy(null); setOfflineItems([]); } },
                ]);
              } else {
                setOfflineTenancy(null);
                setOfflineItems([]);
              }
            } else {
              router.back();
            }
          }}
          style={styles.backRow}
        >
          <Ionicons name="chevron-back" size={20} color={theme.primaryLight} />
          <Text style={[typography.label, { color: theme.primaryLight }]}>Tenancy</Text>
        </Pressable>

        {/* Header */}
        <Text style={[typography.h3, { color: theme.textPrimary, marginTop: 20, marginBottom: 2 }]}>
          Inspection Items
        </Text>
        <Text style={[typography.small, { color: theme.textMuted, marginBottom: 4 }]}>
          {isOnline
            ? (selectedTenancy?.property_title ?? 'Property')
            : (offlineTenancy?.label ?? 'Property')} — document condition of each item
        </Text>

        {!isOnline && (
          <View style={[styles.offlineNote, { backgroundColor: theme.success + '18', borderColor: theme.success }]}>
            <Ionicons name="save-outline" size={16} color={theme.success} />
            <Text style={[typography.caption, { color: theme.success }]}>
              Offline mode — photos saved locally, draft will sync when online
            </Text>
          </View>
        )}
        {isOnline && hasOfflineSession && (
          <View style={[styles.offlineNote, { backgroundColor: theme.primary + '18', borderColor: theme.primary }]}>
            <Ionicons name="wifi-outline" size={16} color={theme.primary} />
            <Text style={[typography.caption, { color: theme.primary }]}>
              You're back online! Tap "Save Draft" to upload now.
            </Text>
          </View>
        )}
        {pendingCount > 0 && (
          <View style={[styles.offlineNote, { backgroundColor: theme.primary + '18', borderColor: theme.primary, marginTop: 6 }]}>
            <Ionicons name="cloud-upload-outline" size={16} color={theme.primary} />
            <Text style={[typography.caption, { color: theme.primary }]}>
              {pendingCount} draft{pendingCount !== 1 ? 's' : ''} pending upload — will sync automatically
            </Text>
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
                onPress={isOnline ? handleAddItem : handleAddOfflineItem}
                loading={uploading && isOnline}
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
        {isOnline && !hasOfflineSession ? (
          // ── Online items (server-backed) ──
          items.length === 0 ? (
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
                    onDelete={() => handleDeleteItem(item.id)}
                  />
                </Animated.View>
              ))}
            </View>
          )
        ) : (
          // ── Offline items (local) ──
          offlineItems.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="clipboard-outline" size={48} color={theme.textMuted} />
              <Text style={[typography.bodyMed, { color: theme.textMuted, marginTop: 12, textAlign: 'center' }]}>
                No items yet. Start by adding items like walls, floors, appliances, and fixtures.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10, marginTop: 20 }}>
              <Text style={[typography.label, { color: theme.textMuted, marginBottom: 4 }]}>
                {offlineItems.length} {offlineItems.length === 1 ? 'ITEM' : 'ITEMS'}
              </Text>
              {offlineItems.map((draftItem, i) => (
                <Animated.View key={draftItem.localId} entering={FadeInDown.delay(i * 40).springify()}>
                  <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border, padding: 12 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>{draftItem.itemName}</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                          <Text style={[typography.caption, { color: theme.textMuted, textTransform: 'capitalize' }]}>
                            {draftItem.condition}
                          </Text>
                          {draftItem.photoUri && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                              <Ionicons name="image-outline" size={12} color={theme.success} />
                              <Text style={[typography.caption, { color: theme.success }]}>Photo saved</Text>
                            </View>
                          )}
                        </View>
                        {draftItem.notes ? (
                          <Text style={[typography.caption, { color: theme.textMuted, marginTop: 4 }]}>{draftItem.notes}</Text>
                        ) : null}
                      </View>
                      <Pressable
                        onPress={() => handleDeleteOfflineItem(draftItem.localId)}
                        hitSlop={8}
                        style={{ padding: 4 }}
                      >
                        <Ionicons name="trash-outline" size={18} color={theme.danger} />
                      </Pressable>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          )
        )}
      </ScrollView>

      {/* Bottom submit bar */}
      {isOnline && !hasOfflineSession ? (
        items.length > 0 && (
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
        )
      ) : (
        offlineItems.length > 0 && (
          <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderColor: theme.border, paddingBottom: insets.bottom + 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>{offlineItems.length} items</Text>
              <Text style={[typography.caption, { color: theme.textMuted }]}>Will sync when back online</Text>
            </View>
            <Button
              title="Save Draft"
              onPress={handleSaveDraft}
              size="md"
              icon="cloud-upload-outline"
            />
          </View>
        )
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
