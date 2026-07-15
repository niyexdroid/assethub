import { api } from './api';
import { API_ENDPOINTS } from '../constants/api';
import { AuthResponse, AuthTokens, CompleteProfileRequest, GoogleAuthResponse, GoogleProfile, LoginRequest, LoginOtpResponse, VerifyLoginOtpResponse } from '../types/auth';

export const authService = {
  login: async (data: LoginRequest): Promise<LoginOtpResponse> => {
    const res = await api.post<LoginOtpResponse>(API_ENDPOINTS.auth.login, data);
    return res.data;
  },

  verifyLoginOtp: async (login_token: string, otp: string): Promise<VerifyLoginOtpResponse> => {
    const res = await api.post<VerifyLoginOtpResponse>(API_ENDPOINTS.auth.verifyLoginOtp, { login_token, otp });
    return res.data;
  },

  resendLoginOtp: async (login_token: string): Promise<void> => {
    await api.post(API_ENDPOINTS.auth.resendLoginOtp, { login_token });
  },

  completeProfile: async (data: CompleteProfileRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(API_ENDPOINTS.auth.completeProfile, data);
    return res.data;
  },

  googleAuth: async (idToken: string): Promise<GoogleAuthResponse> => {
    const res = await api.post<GoogleAuthResponse>(API_ENDPOINTS.auth.google, { idToken });
    return res.data;
  },

  googleComplete: async (profile: GoogleProfile & { role: string; package?: string }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(API_ENDPOINTS.auth.googleComplete, profile);
    return res.data;
  },

  refresh: async (refresh_token: string): Promise<AuthTokens> => {
    const res = await api.post<AuthTokens>(API_ENDPOINTS.auth.refresh, { refresh_token });
    return res.data;
  },

  logout: async (refreshToken?: string): Promise<void> => {
    await api.post(API_ENDPOINTS.auth.logout, { refresh_token: refreshToken });
  },
};
