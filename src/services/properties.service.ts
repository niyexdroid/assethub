import { api } from './api';
import { API_ENDPOINTS } from '../constants/api';

export interface Property {
  id: string;
  title: string;
  address: string;
  lga: string;
  state: string;
  monthly_rent: number | null;
  yearly_rent: number | null;
  tenancy_mode: string;
  bedrooms: number | null;
  bathrooms: number | null;
  listing_type: string;
  property_type: string;
  amenities: string[];
  photos: string[];
  approval_status: string;
  is_available: boolean;
  available_units: number;
  caution_fee: number;
  agency_fee: number;
  description: string | null;
  landlord_first_name?: string;
  landlord_last_name?: string;
  landlord_photo?: string | null;
  created_at: string;
}

export interface SearchFilters {
  lga?: string;
  listing_type?: string;
  property_type?: string;
  min_rent?: number;
  max_rent?: number;
  bedrooms?: number;
  query?: string;
  page?: number;
  limit?: number;
}

export const propertiesService = {
  search: async (filters: SearchFilters = {}): Promise<{ data: Property[]; total: number }> => {
    const res = await api.get(API_ENDPOINTS.properties.search, { params: filters });
    return res.data;
  },

  getById: async (id: string): Promise<Property> => {
    const res = await api.get(API_ENDPOINTS.properties.detail(id));
    return res.data;
  },

  getLandlordProperties: async (): Promise<Property[]> => {
    const res = await api.get(API_ENDPOINTS.properties.landlordMine);
    return res.data;
  },

  getSaved: async (): Promise<Property[]> => {
    const res = await api.get(API_ENDPOINTS.properties.saved);
    return res.data;
  },

  save: async (id: string): Promise<void> => {
    await api.post(API_ENDPOINTS.properties.save(id));
  },

  unsave: async (id: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.properties.save(id));
  },

  create: async (data: Partial<Property>): Promise<Property> => {
    const res = await api.post(API_ENDPOINTS.properties.search, data);
    return res.data;
  },

  update: async (id: string, data: Partial<Property>): Promise<Property> => {
    const res = await api.put(API_ENDPOINTS.properties.detail(id), data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(API_ENDPOINTS.properties.detail(id));
  },

  addPhotos: async (id: string, files: { uri: string; name: string; type: string }[]): Promise<string[]> => {
    const form = new FormData();
    files.forEach(f => form.append('photos', { uri: f.uri, name: f.name, type: f.type } as any));
    const res = await api.post(API_ENDPOINTS.properties.photos(id), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.photos;
  },
};
