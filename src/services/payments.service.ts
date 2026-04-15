import { api } from './api';
import { API_ENDPOINTS } from '../constants/api';

export interface PaymentScheduleItem {
  id: string;
  tenancy_id: string;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'partially_paid';
  paid_at: string | null;
  reference: string | null;
}

export interface PaymentTransaction {
  id: string;
  tenancy_id: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  reference: string;
  channel: string | null;
  paid_at: string;
  property_title?: string;
}

export interface InitPaymentResponse {
  authorization_url: string;
  reference: string;
  access_code: string;
}

export const paymentsService = {
  initialize: async (data: {
    tenancy_id: string;
    schedule_id?: string;
    amount?: number;
  }): Promise<InitPaymentResponse> => {
    const res = await api.post(API_ENDPOINTS.payments.initialize, data);
    return res.data;
  },

  verify: async (reference: string): Promise<{ status: string; transaction: PaymentTransaction }> => {
    const res = await api.get(API_ENDPOINTS.payments.verify(reference));
    return res.data;
  },

  getSchedule: async (tenancyId: string): Promise<PaymentScheduleItem[]> => {
    const res = await api.get(API_ENDPOINTS.payments.schedule(tenancyId));
    return res.data;
  },

  getHistory: async (page = 1): Promise<{ data: PaymentTransaction[]; total: number }> => {
    const res = await api.get(API_ENDPOINTS.payments.history, { params: { page } });
    return res.data;
  },

  getTransaction: async (id: string): Promise<PaymentTransaction> => {
    const res = await api.get(API_ENDPOINTS.payments.transaction(id));
    return res.data;
  },
};
