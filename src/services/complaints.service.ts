import { api } from './api';
import { API_ENDPOINTS } from '../constants/api';

export interface Complaint {
  id: string;
  tenancy_id: string;
  raised_by: string;
  category: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  property_title?: string;
  messages?: ComplaintMessage[];
}

export interface ComplaintMessage {
  id: string;
  complaint_id: string;
  sender_id: string;
  message: string;
  attachments: string[];
  sender_name?: string;
  created_at: string;
}

export const complaintsService = {
  list: async (): Promise<Complaint[]> => {
    const res = await api.get(API_ENDPOINTS.complaints.list);
    return res.data;
  },

  getById: async (id: string): Promise<Complaint> => {
    const res = await api.get(API_ENDPOINTS.complaints.detail(id));
    return res.data;
  },

  create: async (data: {
    tenancy_id: string;
    category: string;
    title: string;
    description: string;
    priority?: string;
  }): Promise<Complaint> => {
    const res = await api.post(API_ENDPOINTS.complaints.create, data);
    return res.data;
  },

  addMessage: async (id: string, message: string, attachments: string[] = []): Promise<ComplaintMessage> => {
    const res = await api.post(API_ENDPOINTS.complaints.messages(id), { message, attachments });
    return res.data;
  },

  escalate: async (id: string): Promise<void> => {
    await api.put(API_ENDPOINTS.complaints.escalate(id));
  },

  resolve: async (id: string, resolutionNotes: string): Promise<void> => {
    await api.put(API_ENDPOINTS.complaints.resolve(id), { resolution_notes: resolutionNotes });
  },
};
