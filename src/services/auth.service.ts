import { api } from './api';
import { API_ENDPOINTS } from '../constants/api';
import { AuthResponse, AuthTokens, GoogleAuthResponse, GoogleProfile, LoginRequest, LoginOtpResponse, RegisterRequest } from '../types/auth';

export const authService = {
  login: async (data: LoginRequest): Promise<LoginOtpResponse> => {
    const res = await api.post<LoginOtpResponse>(API_ENDPOINTS.auth.login, data);
    return res.data;
  },

  verifyLoginOtp: async (login_token: string, otp: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(API_ENDPOINTS.auth.verifyLoginOtp, { login_token, otp });
    return res.data;
  },

  resendLoginOtp: async (login_token: string): Promise<void> => {
    await api.post(API_ENDPOINTS.auth.resendLoginOtp, { login_token });
  },

  googleAuth: async (idToken: string): Promise<GoogleAuthResponse> => {
    const res = await api.post<GoogleAuthResponse>(API_ENDPOINTS.auth.google, { idToken });
    return res.data;
  },

  googleComplete: async (profile: GoogleProfile & { role: string; package?: string }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(API_ENDPOINTS.auth.googleComplete, profile);
    return res.data;
  },

  register: async (data: RegisterRequest): Promise<{ email: string }> => {
    const res = await api.post<{ email: string }>(API_ENDPOINTS.auth.register, data);
    return res.data;
  },

  verifyEmail: async (email: string, otp: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(API_ENDPOINTS.auth.verifyEmail, { email, otp });
    return res.data;
  },

  resendVerification: async (email: string): Promise<void> => {
    await api.post(API_ENDPOINTS.auth.resendVerification, { email });
  },

  refresh: async (refresh_token: string): Promise<AuthTokens> => {
    const res = await api.post<AuthTokens>(API_ENDPOINTS.auth.refresh, { refresh_token });
    return res.data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post(API_ENDPOINTS.auth.forgotPassword, { email });
  },

  resetPassword: async (data: { email: string; otp: string; new_password: string }): Promise<void> => {
    await api.post(API_ENDPOINTS.auth.resetPassword, data);
  },

  logout: async (): Promise<void> => {
    await api.post(API_ENDPOINTS.auth.logout);
  },
};
