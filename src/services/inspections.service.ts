import { api } from './api';
import { API_ENDPOINTS } from '../constants/api';
import type { InspectionReport, InspectionItem } from '../types/inspections';

export const inspectionsService = {
  // ── Photo upload ──────────────────────────────────────────

  uploadPhoto: async (uri: string): Promise<string> => {
    const form = new FormData();
    const filename = uri.split('/').pop() ?? 'inspection.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    form.append('photo', { uri, name: filename, type } as any);
    const res = await api.post<{ url: string }>(API_ENDPOINTS.inspections.upload, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  },

  // ── Reports ───────────────────────────────────────────────

  create: async (tenancyId: string): Promise<InspectionReport> => {
    const res = await api.post(API_ENDPOINTS.inspections.create, { tenancy_id: tenancyId });
    return res.data;
  },

  list: async (): Promise<InspectionReport[]> => {
    const res = await api.get(API_ENDPOINTS.inspections.list);
    return res.data;
  },

  getById: async (id: string): Promise<InspectionReport> => {
    const res = await api.get(API_ENDPOINTS.inspections.detail(id));
    return res.data;
  },

  // ── Items ─────────────────────────────────────────────────

  addItem: async (
    reportId: string,
    data: {
      item_name: string;
      condition: string;
      description?: string;
      notes?: string;
      photo_urls: string[];
      capture_source?: string;
      captured_at?: string;
    },
  ): Promise<InspectionItem> => {
    const res = await api.post(API_ENDPOINTS.inspections.items(reportId), data);
    return res.data;
  },

  updateItem: async (
    reportId: string,
    itemId: string,
    data: { condition?: string; notes?: string; item_name?: string },
  ): Promise<InspectionItem> => {
    const res = await api.put(API_ENDPOINTS.inspections.item(reportId, itemId), data);
    return res.data;
  },

  deleteItem: async (reportId: string, itemId: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.inspections.item(reportId, itemId));
  },

  // ── State transitions ─────────────────────────────────────

  submit: async (reportId: string): Promise<InspectionReport> => {
    const res = await api.put(API_ENDPOINTS.inspections.submit(reportId));
    return res.data;
  },

  sign: async (
    reportId: string,
    data: { content_hash: string; gps_lat?: number; gps_lng?: number; gps_captured_at?: string },
  ): Promise<InspectionReport> => {
    const res = await api.put(API_ENDPOINTS.inspections.sign(reportId), data);
    return res.data;
  },

  dispute: async (reportId: string, reason: string): Promise<InspectionReport> => {
    const res = await api.put(API_ENDPOINTS.inspections.dispute(reportId), { reason });
    return res.data;
  },

  deleteReport: async (reportId: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.inspections.detail(reportId));
  },
};
