export type UserRole = 'tenant' | 'landlord';
export type TenantPackage = 'standard' | 'student';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
  role: UserRole;
  package?: TenantPackage;
  is_verified: boolean;
  avatar?:     string;
  avatar_url?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginRequest {
  identifier: string; // phone or email
  password: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
  password: string;
  role: UserRole;
  package?: TenantPackage;
}

export interface VerifyOtpRequest {
  phone_number: string;
  otp: string;
}
