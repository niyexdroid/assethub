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
}

export interface LoginOtpResponse {
  requiresOtp: true;
  login_token: string;
}

export type VerifyLoginOtpResponse =
  | { isNewUser: true; profile_token: string; user?: undefined; tokens?: undefined }
  | { isNewUser?: undefined; user: User; tokens: AuthTokens; profile_token?: undefined };

export interface CompleteProfileRequest {
  profile_token: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  package_type?: TenantPackage;
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
