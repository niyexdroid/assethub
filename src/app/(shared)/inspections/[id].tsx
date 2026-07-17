import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Location from 'expo-location';
import { useTheme } from '../../../hooks/useTheme';
import { useAuthStore } from '../../../store/auth.store';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { InspectionItem as InspectionItemView } from '../../../components/inspection/InspectionItem';
import { typography } from '../../../constants/typography';
import { inspectionsService } from '../../../services/inspections.service';
import { INSPECTION_STATUS_BADGE } from '../../../types/inspections';
import type { InspectionReport } from '../../../types/inspections';

export default function InspectionDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [report, setReport] = useState<InspectionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signing, setSigning] = useState(false);
  const [disputing, setDisputing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await inspectionsService.getById(id);
      setReport(data);
    } catch {
      setError('Could not load inspection.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const isTenant = user?.id === report?.created_by;
  const canSign = report && ['pending_review', 'disputed'].includes(report.status) && report.content_hash;
  const userSigned = report && (isTenant ? report.tenant_signed_at : report.landlord_signed_at);
  const canDispute = report?.status === 'signed' && (isTenant || user?.id !== report?.created_by);

  const handleSign = async () => {
    if (!report || !id) return;
    setSigning(true);
    try {
      let gps: { gps_lat?: number; gps_lng?: number; gps_captured_at?: string } = {};
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          gps = {
            gps_lat: loc.coords.latitude,
            gps_lng: loc.coords.longitude,
            gps_captured_at: new Date(loc.timestamp).toISOString(),
          };
        }
      } catch { /* GPS optional */ }

      await inspectionsService.sign(id, {
        content_hash: report.content_hash!,
        ...gps,
      });
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not sign inspection.');
    } finally {
      setSigning(false);
    }
  };

  const handleDispute = () => {
    Alert.alert(
      'Dispute Inspection',
      'This will reset both signatures. Both parties will need to re-sign.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispute',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            setDisputing(true);
            try {
              await inspectionsService.dispute(id, 'Disputed by ' + (isTenant ? 'tenant' : 'landlord'));
              load();
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message ?? 'Could not dispute inspection.');
            } finally {
              setDisputing(false);
            }
          },
        },
      ],
    );
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  // ── Loading ──
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // ── Error / not found ──
  if (error || !report) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
        <Text style={[typography.bodyMed, { color: theme.textPrimary, marginTop: 12 }]}>{error || 'Inspection not found.'}</Text>
        <Pressable onPress={load} style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.primary }}>
          <Text style={[typography.label, { color: theme.primary }]}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const statusBadge = INSPECTION_STATUS_BADGE[report.status] ?? INSPECTION_STATUS_BADGE.draft;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="chevron-back" size={20} color={theme.primaryLight} />
        <Text style={[typography.label, { color: theme.primaryLight }]}>Inspection</Text>
      </Pressable>

      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 4 }}>
        <Text style={[typography.h3, { color: theme.textPrimary, flex: 1 }]}>Inspection Report</Text>
        <Badge label={statusBadge.label} variant={statusBadge.variant} />
      </View>
      <Text style={[typography.caption, { color: theme.textMuted }]}>ID: {report.id.slice(0, 8)}...</Text>

      {/* Property + Parties card */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 20 }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="home-outline" size={18} color={theme.textMuted} />
          <Text style={[typography.label, { color: theme.textMuted }]}>PROPERTY & PARTIES</Text>
        </View>
        <View style={{ marginTop: 8, gap: 6 }}>
          {report.property_title && (
            <Text style={[typography.bodyMed, { color: theme.textPrimary }]}>{report.property_title}</Text>
          )}
          <Text style={[typography.small, { color: theme.textMuted }]}>
            Tenant: {report.tenant_name ?? '—'}
          </Text>
          <Text style={[typography.small, { color: theme.textMuted }]}>
            Landlord: {report.landlord_name ?? '—'}
          </Text>
        </View>
      </View>

      {/* Signatures card */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="document-text-outline" size={18} color={theme.textMuted} />
          <Text style={[typography.label, { color: theme.textMuted }]}>SIGNATURES</Text>
        </View>
        <View style={{ marginTop: 8, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.dot, { backgroundColor: report.tenant_signed_at ? theme.success : theme.textMuted }]} />
            <Text style={[typography.small, { color: theme.textSecondary }]}>
              Tenant {report.tenant_signed_at ? `signed ${formatDate(report.tenant_signed_at)}` : 'not signed'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.dot, { backgroundColor: report.landlord_signed_at ? theme.success : theme.textMuted }]} />
            <Text style={[typography.small, { color: theme.textSecondary }]}>
              Landlord {report.landlord_signed_at ? `signed ${formatDate(report.landlord_signed_at)}` : 'not signed'}
            </Text>
          </View>
          {report.gps_lat != null && (
            <Text style={[typography.caption, { color: theme.textMuted, marginTop: 4 }]}>
              📍 {report.gps_lat.toFixed(6)}, {report.gps_lng?.toFixed(6)} — captured at sign
            </Text>
          )}
        </View>
      </View>

      {/* Items */}
      <View style={{ marginTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={[typography.label, { color: theme.textMuted }]}>
            {report.items?.length ?? 0} ITEMS
          </Text>
        </View>
        {report.items && report.items.length > 0 ? (
          <View style={{ gap: 10 }}>
            {report.items.map((item, i) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(i * 40).springify()}>
                <InspectionItemView item={item} />
              </Animated.View>
            ))}
          </View>
        ) : (
          <Text style={[typography.small, { color: theme.textMuted, textAlign: 'center', paddingVertical: 24 }]}>
            No items in this report.
          </Text>
        )}
      </View>

      {/* Content hash */}
      {report.content_hash && (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark-outline" size={18} color={theme.textMuted} />
            <Text style={[typography.label, { color: theme.textMuted }]}>CONTENT HASH</Text>
          </View>
          <Text style={[typography.caption, { color: theme.textMuted, marginTop: 8, fontFamily: 'monospace' }]}>
            {report.content_hash}
          </Text>
        </View>
      )}

      {/* PDF */}
      {report.pdf_url && (
        <Button
          title="Download PDF Report"
          onPress={() => Linking.openURL(report.pdf_url!)}
          variant="outline"
          size="md"
          style={{ marginTop: 14 }}
        />
      )}

      {/* Dispute info */}
      {report.status === 'disputed' && report.dispute_reason && (
        <View style={[styles.card, { backgroundColor: theme.danger + '10', borderColor: theme.danger, marginTop: 14 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Ionicons name="warning" size={18} color={theme.danger} />
            <Text style={[typography.label, { color: theme.danger }]}>DISPUTED</Text>
          </View>
          <Text style={[typography.small, { color: theme.textSecondary }]}>{report.dispute_reason}</Text>
          {report.disputed_at && (
            <Text style={[typography.caption, { color: theme.textMuted, marginTop: 4 }]}>
              {formatDate(report.disputed_at)}
            </Text>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={{ gap: 10, marginTop: 24 }}>
        {canSign && !userSigned && (
          <Button
            title={isTenant ? 'Sign as Tenant' : 'Sign as Landlord'}
            onPress={handleSign}
            loading={signing}
            size="lg"
            icon="checkmark-circle-outline"
          />
        )}
        {canDispute && (
          <Button
            title="Dispute Report"
            onPress={handleDispute}
            variant="danger"
            loading={disputing}
            size="lg"
          />
        )}
        <Button title="Back" onPress={() => router.back()} variant="ghost" size="lg" />
      </View>

      {/* Timestamps */}
      <Text style={[typography.caption, { color: theme.textMuted, marginTop: 20, textAlign: 'center' }]}>
        Created {formatDate(report.created_at)}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
