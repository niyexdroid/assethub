import { api } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/api.endpoints'
import type { AuthResponse, LoginRequest, LoginOtpResponse, RegisterRequest, AuthTokens, GoogleAuthResponse, GoogleCompleteRequest } from '@/types/auth'

export const authService = {
  login: async (data: LoginRequest): Promise<LoginOtpResponse> => {
    const res = await api.post<LoginOtpResponse>(API_ENDPOINTS.auth.login, data)
    return res.data
  },

  verifyLoginOtp: async (login_token: string, otp: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(API_ENDPOINTS.auth.verifyLoginOtp, { login_token, otp })
    return res.data
  },

  resendLoginOtp: async (login_token: string): Promise<void> => {
    await api.post(API_ENDPOINTS.auth.resendLoginOtp, { login_token })
  },

  register: async (data: RegisterRequest): Promise<{ email: string }> => {
    const res = await api.post<{ email: string }>(API_ENDPOINTS.auth.register, data)
    return res.data
  },

  verifyEmail: async (email: string, otp: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(API_ENDPOINTS.auth.verifyEmail, { email, otp })
    return res.data
  },

  resendVerification: async (email: string): Promise<void> => {
    await api.post(API_ENDPOINTS.auth.resendVerification, { email })
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post(API_ENDPOINTS.auth.forgotPassword, { email })
  },

  resetPassword: async (data: { email: string; otp: string; new_password: string }): Promise<void> => {
    await api.post(API_ENDPOINTS.auth.resetPassword, data)
  },

  logout: async (refreshToken?: string): Promise<void> => {
    await api.post(API_ENDPOINTS.auth.logout, { refresh_token: refreshToken })
  },

  googleAuth: async (idToken: string): Promise<GoogleAuthResponse> => {
    const res = await api.post<GoogleAuthResponse>(API_ENDPOINTS.auth.google, { idToken })
    return res.data
  },

  googleAuthCode: async (code: string): Promise<GoogleAuthResponse> => {
    const res = await api.post<GoogleAuthResponse>(API_ENDPOINTS.auth.google, { code, redirectUri: 'postmessage' })
    return res.data
  },

  googleComplete: async (profile: GoogleCompleteRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(API_ENDPOINTS.auth.googleComplete, profile)
    return res.data
  },
}
