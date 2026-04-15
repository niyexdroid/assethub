import { api } from './api';
import { API_ENDPOINTS } from '../constants/api';

export interface Tenancy {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  status: 'pending' | 'active' | 'terminated' | 'declined';
  start_date: string;
  end_date: string;
  monthly_rent: number;
  caution_fee: number;
  agency_fee: number;
  tenancy_mode: string;
  tenant_signed_at: string | null;
  landlord_signed_at: string | null;
  termination_reason: string | null;
  property?: {
    title: string;
    address: string;
    lga: string;
    photos: string[];
  };
  tenant?: {
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
  };
  created_at: string;
}

export const tenanciesService = {
  getTenantTenancies: async (): Promise<Tenancy[]> => {
    const res = await api.get(API_ENDPOINTS.tenancies.tenantMine);
    return res.data;
  },

  getLandlordTenancies: async (): Promise<Tenancy[]> => {
    const res = await api.get(API_ENDPOINTS.tenancies.landlordMine);
    return res.data;
  },

  getById: async (id: string): Promise<Tenancy> => {
    const res = await api.get(API_ENDPOINTS.tenancies.detail(id));
    return res.data;
  },

  create: async (data: {
    property_id: string;
    tenant_id: string;
    start_date: string;
    end_date: string;
    monthly_rent: number;
    caution_fee?: number;
    agency_fee?: number;
    tenancy_mode?: string;
  }): Promise<Tenancy> => {
    const res = await api.post(API_ENDPOINTS.tenancies.create, data);
    return res.data;
  },

  accept: async (id: string): Promise<Tenancy> => {
    const res = await api.put(API_ENDPOINTS.tenancies.accept(id));
    return res.data;
  },

  decline: async (id: string): Promise<Tenancy> => {
    const res = await api.put(API_ENDPOINTS.tenancies.decline(id));
    return res.data;
  },

  terminate: async (id: string, reason: string): Promise<void> => {
    await api.put(API_ENDPOINTS.tenancies.terminate(id), { reason });
  },

  signAsTenant: async (id: string): Promise<void> => {
    await api.post(API_ENDPOINTS.tenancies.signTenant(id));
  },

  signAsLandlord: async (id: string): Promise<void> => {
    await api.post(API_ENDPOINTS.tenancies.signLandlord(id));
  },
};
