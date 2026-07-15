import { api } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/api.endpoints'
import type { AuthResponse, LoginRequest, LoginOtpResponse, VerifyLoginOtpResponse, CompleteProfileRequest, GoogleAuthResponse, GoogleCompleteRequest } from '@/types/auth'

export const authService = {
  login: async (data: LoginRequest): Promise<LoginOtpResponse> => {
    const res = await api.post<LoginOtpResponse>(API_ENDPOINTS.auth.login, data)
    return res.data
  },

  verifyLoginOtp: async (login_token: string, otp: string): Promise<VerifyLoginOtpResponse> => {
    const res = await api.post<VerifyLoginOtpResponse>(API_ENDPOINTS.auth.verifyLoginOtp, { login_token, otp })
    return res.data
  },

  resendLoginOtp: async (login_token: string): Promise<void> => {
    await api.post(API_ENDPOINTS.auth.resendLoginOtp, { login_token })
  },

  completeProfile: async (data: CompleteProfileRequest): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>(API_ENDPOINTS.auth.completeProfile, data)
    return res.data
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
