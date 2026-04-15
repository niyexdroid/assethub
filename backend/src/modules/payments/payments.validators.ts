import { z } from 'zod';

export const initPaymentSchema = z.object({
  schedule_id:  z.string().uuid(),
  callback_url: z.string().url().optional(),
});

export const verifyPaymentSchema = z.object({
  reference: z.string(),
});

export type InitPaymentInput = z.infer<typeof initPaymentSchema>;
