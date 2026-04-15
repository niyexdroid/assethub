import { api } from './api';
import { API_ENDPOINTS } from '../constants/api';
import { AuthResponse, LoginRequest, RegisterRequest, VerifyOtpRequest } from '../types/auth';

export const authService = {
  requestOtp: async (phone_number: string): Promise<void> => {
    await api.post(API_ENDPOINTS.auth.requestOtp, { phone_number });
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(API_ENDPOINTS.auth.login, data);
    return res.data;
  },

  register: async (data: RegisterRequest): Promise<{ phone_number: string }> => {
    const res = await api.post(API_ENDPOINTS.auth.register, data);
    return res.data;
  },

  verifyOtp: async (data: VerifyOtpRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(API_ENDPOINTS.auth.verifyOtp, data);
    return res.data;
  },

  forgotPassword: async (phone_number: string): Promise<void> => {
    await api.post(API_ENDPOINTS.auth.forgotPassword, { phone_number });
  },

  resetPassword: async (data: { phone_number: string; otp: string; new_password: string }): Promise<void> => {
    await api.post(API_ENDPOINTS.auth.resetPassword, data);
  },

  logout: async (): Promise<void> => {
    await api.post(API_ENDPOINTS.auth.logout);
  },
};
