import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const loginVerifySchema = z.object({
  login_token: z.string().uuid(),
  otp:         z.string().length(6, 'OTP must be 6 digits'),
});

export const completeProfileSchema = z.object({
  profile_token: z.string().uuid(),
  first_name:    z.string().min(1).max(100),
  last_name:     z.string().min(1).max(100),
  role:          z.enum(['landlord', 'tenant']),
  package_type:  z.enum(['standard', 'student']).default('standard').optional(),
  package:       z.enum(['standard', 'student']).optional(),
});

export const googleAuthSchema = z.object({
  idToken: z.string().optional(),
  code: z.string().optional(),
  redirectUri: z.string().optional(),
}).refine(d => d.idToken || d.code, { message: 'Either idToken or code is required' });

export const googleCompleteSchema = z.object({
  googleId:   z.string(),
  email:      z.string().email(),
  first_name: z.string().min(1),
  last_name:  z.string().min(1),
  avatar_url: z.string().url().optional(),
  role:       z.enum(['landlord', 'tenant']),
  package:    z.enum(['standard', 'student']).optional(),
});

export const refreshSchema = z.object({
  refresh_token: z.string(),
});

export const resetRequestSchema = z.object({
  email: z.string().email(),
});

export type LoginInput          = z.infer<typeof loginSchema>;
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
export type GoogleCompleteInput  = z.infer<typeof googleCompleteSchema>;
