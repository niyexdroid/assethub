import { api } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/api.endpoints'
import type { Tenancy } from '@/types/tenancy'

export const tenanciesService = {
  getTenantTenancies: async (): Promise<Tenancy[]> => {
    const res = await api.get(API_ENDPOINTS.tenancies.tenantMine)
    return Array.isArray(res.data) ? res.data : res.data.data ?? []
  },

  getLandlordTenancies: async (): Promise<Tenancy[]> => {
    const res = await api.get(API_ENDPOINTS.tenancies.landlordMine)
    return Array.isArray(res.data) ? res.data : res.data.data ?? []
  },

  getById: async (id: string): Promise<Tenancy> => {
    const res = await api.get(API_ENDPOINTS.tenancies.detail(id))
    return res.data
  },

  getAgreement: async (id: string): Promise<any> => {
    const res = await api.get(API_ENDPOINTS.tenancies.agreement(id))
    return res.data
  },

  apply: async (data: any): Promise<any> => {
    const res = await api.post(API_ENDPOINTS.tenancies.apply, data)
    return res.data
  },

  getMyApplications: async (): Promise<any[]> => {
    const res = await api.get(API_ENDPOINTS.tenancies.myApplications)
    return Array.isArray(res.data) ? res.data : res.data.data ?? []
  },

  getReceivedApplications: async (): Promise<any[]> => {
    const res = await api.get(API_ENDPOINTS.tenancies.receivedApplications)
    return Array.isArray(res.data) ? res.data : res.data.data ?? []
  },

  approveApplication: async (id: string): Promise<void> => {
    await api.put(API_ENDPOINTS.tenancies.approveApplication(id))
  },

  rejectApplication: async (id: string): Promise<void> => {
    await api.put(API_ENDPOINTS.tenancies.rejectApplication(id))
  },

  accept: async (id: string): Promise<void> => {
    await api.put(API_ENDPOINTS.tenancies.accept(id))
  },

  decline: async (id: string): Promise<void> => {
    await api.put(API_ENDPOINTS.tenancies.decline(id))
  },

  signTenant: async (id: string): Promise<void> => {
    await api.put(API_ENDPOINTS.tenancies.signTenant(id))
  },

  signLandlord: async (id: string): Promise<void> => {
    await api.put(API_ENDPOINTS.tenancies.signLandlord(id))
  },

  terminate: async (id: string): Promise<void> => {
    await api.put(API_ENDPOINTS.tenancies.terminate(id))
  },
}

export type { Tenancy }
