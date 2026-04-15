import { z } from 'zod';

export const bvnSchema = z.object({
  bvn: z.string().length(11, 'BVN must be 11 digits').regex(/^\d+$/, 'BVN must be numeric'),
});

export const ninSchema = z.object({
  nin: z.string().length(11, 'NIN must be 11 digits').regex(/^\d+$/, 'NIN must be numeric'),
});

export const studentIdSchema = z.object({
  school_name:  z.string().min(2),
  school_email: z.string().email().optional(),
});

export const schoolEmailVerifySchema = z.object({
  otp: z.string().length(6),
});
