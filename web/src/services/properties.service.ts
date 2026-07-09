import { api } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/api.endpoints'
import type { Property, SearchFilters } from '@/types/property'

export const propertiesService = {
  search: async (filters: SearchFilters = {}) => {
    const res = await api.get(API_ENDPOINTS.properties.search, { params: filters })
    return res.data as { data: Property[]; total: number }
  },

  getById: async (id: string): Promise<Property> => {
    const res = await api.get(API_ENDPOINTS.properties.detail(id))
    return res.data as Property
  },

  getLandlordProperties: async (): Promise<Property[]> => {
    const res = await api.get(API_ENDPOINTS.properties.landlordMine)
    return Array.isArray(res.data) ? res.data : res.data.data ?? []
  },

  getSavedProperties: async (): Promise<Property[]> => {
    const res = await api.get(API_ENDPOINTS.properties.saved)
    return Array.isArray(res.data) ? res.data : res.data.data ?? []
  },

  saveProperty: async (id: string): Promise<void> => {
    await api.post(API_ENDPOINTS.properties.save(id))
  },

  create: async (data: any): Promise<Property> => {
    const res = await api.post(API_ENDPOINTS.properties.search, data)
    return res.data
  },

  update: async (id: string, data: any): Promise<Property> => {
    const res = await api.put(API_ENDPOINTS.properties.detail(id), data)
    return res.data
  },
}

export type { Property, SearchFilters }
