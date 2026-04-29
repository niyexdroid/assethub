import { z } from 'zod';

export const registerSchema = z.object({
  email:        z.string().email('Invalid email address'),
  password:     z.string().min(8, 'Password must be at least 8 characters'),
  first_name:   z.string().min(1).max(100),
  last_name:    z.string().min(1).max(100),
  role:         z.enum(['landlord', 'tenant']),
  package_type: z.enum(['standard', 'student']).default('standard').optional(),
  package:      z.enum(['standard', 'student']).optional(),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string(),
});

export const loginVerifySchema = z.object({
  login_token: z.string().uuid(),
  otp:         z.string().length(6, 'OTP must be 6 digits'),
});

export const googleAuthSchema = z.object({
  idToken: z.string(),
});

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

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  otp:   z.string().length(6, 'OTP must be 6 digits'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email(),
});

export const resetRequestSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email:        z.string().email(),
  otp:          z.string().length(6, 'OTP must be 6 digits'),
  new_password: z.string().min(8),
});

export type RegisterInput        = z.infer<typeof registerSchema>;
export type LoginInput           = z.infer<typeof loginSchema>;
export type ResetPasswordInput   = z.infer<typeof resetPasswordSchema>;
export type GoogleCompleteInput  = z.infer<typeof googleCompleteSchema>;
