import { z } from 'zod';

export const updateProfileSchema = z.object({
  first_name:  z.string().min(1).max(100).optional(),
  last_name:   z.string().min(1).max(100).optional(),
  email:       z.string().email().optional().nullable(),
  avatar_url:  z.string().url().optional().nullable(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password:     z.string().min(8, 'New password must be at least 8 characters'),
});

export const changePhoneRequestSchema = z.object({
  new_phone: z.string().regex(/^(\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number'),
});

export const changePhoneVerifySchema = z.object({
  new_phone: z.string().regex(/^(\+234|0)[789]\d{9}$/),
  otp:       z.string().length(6, 'OTP must be 6 digits'),
});

export type UpdateProfileInput     = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput    = z.infer<typeof changePasswordSchema>;
export type ChangePhoneRequestInput = z.infer<typeof changePhoneRequestSchema>;
export type ChangePhoneVerifyInput  = z.infer<typeof changePhoneVerifySchema>;
