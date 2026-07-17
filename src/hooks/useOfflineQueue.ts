import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetworkStatus } from './useNetworkStatus';
import { inspectionsService } from '../services/inspections.service';

const STORAGE_KEY = 'inspection_drafts';
const PROCESSING_KEY = 'inspection_drafts_processing';

export interface DraftItem {
  localId: string;
  itemName: string;
  condition: string;
  notes?: string;
  photoUri: string | null; // local file URI
  capturedAt: string;
}

export interface InspectionDraft {
  id: string;
  tenancyId: string;
  tenancyLabel: string; // property title or address, for display
  items: DraftItem[];
  reportId?: string; // set after server report created, for idempotent retry
  createdAt: string;
}

let _idCounter = 0;
function localId(): string {
  _idCounter++;
  return `${Date.now().toString(36)}_${_idCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

async function readDrafts(): Promise<InspectionDraft[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeDrafts(drafts: InspectionDraft[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function useOfflineQueue() {
  const { isOnline } = useNetworkStatus();
  const [drafts, setDrafts] = useState<InspectionDraft[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; label: string } | null>(null);
  const processingRef = useRef(false);

  const processAll = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    const pending = await readDrafts();
    if (!pending.length) {
      setIsProcessing(false);
      processingRef.current = false;
      return;
    }

    // Guard: avoid concurrent processing across tabs/sessions
    // ponytail: TOCTOU between getItem and setItem — two tabs could race.
    // Acceptable for mobile single-user; swap for a mutex-like pattern if it bites.
    const lock = await AsyncStorage.getItem(PROCESSING_KEY);
    if (lock) {
      setIsProcessing(false);
      processingRef.current = false;
      return;
    }
    await AsyncStorage.setItem(PROCESSING_KEY, '1');

    const total = pending.length;

    try {
      const processedIds: string[] = [];

      for (let i = 0; i < pending.length; i++) {
        const draft = pending[i];
        setProgress({ current: i + 1, total, label: 'Creating report...' });

        try {
          // Reuse existing report if draft was partially processed before
          let reportId = draft.reportId;
          if (!reportId) {
            const report = await inspectionsService.create(draft.tenancyId);
            reportId = report.id;
            // Persist reportId so retry is idempotent
            draft.reportId = reportId;
            const latest = await readDrafts();
            const updated = latest.map(d => d.id === draft.id ? { ...d, reportId } : d);
            await writeDrafts(updated);
          }

          for (let j = 0; j < draft.items.length; j++) {
            const item = draft.items[j];
            setProgress({ current: i + 1, total, label: `Uploading photo ${j + 1}/${draft.items.length}...` });

            let photoUrl: string | null = null;
            if (item.photoUri) {
              try {
                photoUrl = await inspectionsService.uploadPhoto(item.photoUri);
              } catch (err) {
                console.error(`[OfflineQueue] Photo upload failed for item "${item.itemName}":`, err);
              }
            }

            setProgress({ current: i + 1, total, label: `Saving item ${j + 1}/${draft.items.length}...` });
            await inspectionsService.addItem(reportId, {
              item_name: item.itemName,
              condition: item.condition,
              notes: item.notes,
              photo_urls: photoUrl ? [photoUrl] : [],
              capture_source: 'camera',
              captured_at: item.capturedAt,
            });
          }

          setProgress({ current: i + 1, total, label: 'Submitting...' });
          await inspectionsService.submit(reportId);
          processedIds.push(draft.id);
        } catch (err) {
          console.error(`[OfflineQueue] Draft ${draft.id} processing failed, will retry:`, err);
        }
      }

      // Remove only successfully processed drafts
      const current = await readDrafts();
      const remaining = current.filter(d => !processedIds.includes(d.id));
      await writeDrafts(remaining);

      // ponytail: verify-after-write — concurrent enqueue between read & write
      // could be lost. Re-read and re-filter if lengths differ.
      const verify = await readDrafts();
      if (verify.length !== remaining.length) {
        const fixed = verify.filter(d => !processedIds.includes(d.id));
        await writeDrafts(fixed);
        setDrafts(fixed);
      } else {
        setDrafts(remaining);
      }
    } finally {
      await AsyncStorage.removeItem(PROCESSING_KEY);
      setProgress(null);
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, []);

  // Load drafts on mount
  useEffect(() => {
    readDrafts().then(setDrafts);
  }, []);

  // Auto-drain when back online
  useEffect(() => {
    if (isOnline && drafts.length > 0 && !processingRef.current) {
      processAll();
    }
  }, [isOnline, drafts.length, processAll]);

  const enqueue = useCallback(async (draft: Omit<InspectionDraft, 'id' | 'createdAt'>) => {
    const full: InspectionDraft = {
      ...draft,
      id: localId(),
      createdAt: new Date().toISOString(),
    };
    const current = await readDrafts();
    const updated = [...current, full];
    await writeDrafts(updated);
    setDrafts(updated);
    return full;
  }, []);

  const removeDraft = useCallback(async (id: string) => {
    const current = await readDrafts();
    const updated = current.filter(d => d.id !== id);
    await writeDrafts(updated);
    setDrafts(updated);
  }, []);

  return {
    drafts,
    pendingCount: drafts.length,
    isProcessing,
    progress,
    enqueue,
    removeDraft,
    processAll,
  };
}
