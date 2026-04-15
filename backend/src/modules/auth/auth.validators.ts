import { z } from 'zod';

const phoneRegex = /^(\+234|0)[789]\d{9}$/;

export const registerSchema = z.object({
  phone_number: z.string().regex(phoneRegex, 'Invalid Nigerian phone number'),
  email:        z.string().email().optional(),
  password:     z.string().min(8, 'Password must be at least 8 characters'),
  first_name:   z.string().min(1).max(100),
  last_name:    z.string().min(1).max(100),
  role:         z.enum(['landlord', 'tenant']),
  package_type: z.enum(['standard', 'student']).default('standard').optional(),
  package:      z.enum(['standard', 'student']).optional(),
});

export const loginSchema = z.object({
  identifier: z.string(), // phone or email
  password:   z.string(),
});

export const otpRequestSchema = z.object({
  phone_number: z.string().regex(phoneRegex, 'Invalid Nigerian phone number'),
});

export const otpVerifySchema = z.object({
  phone_number: z.string().regex(phoneRegex),
  otp:          z.string().length(6, 'OTP must be 6 digits'),
});

export const refreshSchema = z.object({
  refresh_token: z.string(),
});

export const resetRequestSchema = z.object({
  phone_number: z.string().regex(phoneRegex),
});

export const resetPasswordSchema = z.object({
  phone_number: z.string().regex(phoneRegex),
  otp:          z.string().length(6),
  new_password: z.string().min(8),
});

export type RegisterInput    = z.infer<typeof registerSchema>;
export type LoginInput       = z.infer<typeof loginSchema>;
export type OtpVerifyInput   = z.infer<typeof otpVerifySchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
