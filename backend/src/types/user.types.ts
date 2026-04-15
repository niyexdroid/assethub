export type UserRole = 'landlord' | 'tenant' | 'admin';
export type PackageType = 'standard' | 'student';

export interface User {
  id: string;
  phone_number: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_photo_url?: string;
  role: UserRole;
  package_type: PackageType;
  is_verified: boolean;
  is_active: boolean;
  fcm_token?: string;
  whatsapp_opt_in: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuthTokenPayload {
  sub: string;       // user id
  role: UserRole;
  type: 'access' | 'refresh';
}
