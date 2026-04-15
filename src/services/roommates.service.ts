import { api } from './api';
import { API_ENDPOINTS } from '../constants/api';

export interface RoommateProfile {
  id: string;
  tenant_id: string;
  budget_min: number;
  budget_max: number;
  preferred_lgas: string[];
  lifestyle: string[];
  gender_preference: string;
  bio: string | null;
  is_active: boolean;
  tenant?: {
    first_name: string;
    last_name: string;
    profile_photo_url: string | null;
  };
}

export interface RoommateMatch {
  id: string;
  score: number;
  profile: RoommateProfile;
}

export interface RoommateRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  property_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message: string | null;
  requester?: { first_name: string; last_name: string; profile_photo_url: string | null };
  property?: { title: string; address: string };
  created_at: string;
}

export const roommatesService = {
  getProfile: async (): Promise<RoommateProfile | null> => {
    try {
      const res = await api.get(API_ENDPOINTS.roommates.profile);
      return res.data;
    } catch (e: any) {
      if (e?.response?.status === 404) return null;
      throw e;
    }
  },

  upsertProfile: async (data: Partial<RoommateProfile>): Promise<RoommateProfile> => {
    const res = await api.post(API_ENDPOINTS.roommates.profile, data);
    return res.data;
  },

  deactivateProfile: async (): Promise<void> => {
    await api.delete(API_ENDPOINTS.roommates.profile);
  },

  getMatches: async (propertyId: string): Promise<RoommateMatch[]> => {
    const res = await api.get(API_ENDPOINTS.roommates.matches(propertyId));
    return res.data;
  },

  sendRequest: async (data: { recipient_id: string; property_id: string; message?: string }): Promise<void> => {
    await api.post(API_ENDPOINTS.roommates.request, data);
  },

  acceptRequest: async (id: string): Promise<void> => {
    await api.put(API_ENDPOINTS.roommates.acceptRequest(id));
  },

  declineRequest: async (id: string): Promise<void> => {
    await api.put(API_ENDPOINTS.roommates.declineRequest(id));
  },

  getReceivedRequests: async (): Promise<RoommateRequest[]> => {
    const res = await api.get(API_ENDPOINTS.roommates.receivedRequests);
    return res.data;
  },

  getSentRequests: async (): Promise<RoommateRequest[]> => {
    const res = await api.get(API_ENDPOINTS.roommates.sentRequests);
    return res.data;
  },
};
