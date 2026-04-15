import { api } from './api';
import { API_ENDPOINTS } from '../constants/api';

export const kycService = {
  submitBvn: async (bvn: string): Promise<void> => {
    await api.post(API_ENDPOINTS.kyc.bvn, { bvn });
  },

  submitNin: async (nin: string): Promise<void> => {
    await api.post(API_ENDPOINTS.kyc.nin, { nin });
  },

  submitStudentId: async (imageUri: string, schoolName: string, schoolEmail?: string): Promise<void> => {
    const form = new FormData();
    const filename = imageUri.split('/').pop() ?? 'student-id.jpg';
    const match    = /\.(\w+)$/.exec(filename);
    const type     = match ? `image/${match[1]}` : 'image/jpeg';
    form.append('file', { uri: imageUri, name: filename, type } as any);
    form.append('school_name', schoolName);
    if (schoolEmail) form.append('school_email', schoolEmail);
    await api.post(API_ENDPOINTS.kyc.student, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getStatus: async (): Promise<{ status: string; type: string | null; verified_at: string | null }> => {
    const res = await api.get(API_ENDPOINTS.kyc.status);
    return res.data;
  },
};
