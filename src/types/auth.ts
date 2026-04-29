export type UserRole = 'tenant' | 'landlord';
export type TenantPackage = 'standard' | 'student';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
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
  email: string;
  password: string;
}

export interface LoginOtpResponse {
  requiresOtp: true;
  login_token: string;
}

export interface GoogleProfile {
  googleId:   string;
  email:      string;
  first_name: string;
  last_name:  string;
  avatar_url?: string;
}

export type GoogleAuthResponse =
  | { isNewUser: false; user: User; tokens: AuthTokens }
  | { isNewUser: true;  profile: GoogleProfile };

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: UserRole;
  package?: TenantPackage;
}
