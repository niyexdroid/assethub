import { z } from 'zod';

export const applySchema = z.object({
  property_id:  z.string().uuid(),
  tenancy_type: z.enum(['monthly', 'yearly']),
  move_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  message:      z.string().max(500).optional(),
});

export const rejectApplicationSchema = z.object({
  reason: z.string().min(5),
});

export type ApplyInput = z.infer<typeof applySchema>;

export const createTenancySchema = z.object({
  property_id:    z.string().uuid(),
  tenant_id:      z.string().uuid(),
  tenancy_type:   z.enum(['monthly','yearly','semester']),
  start_date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  end_date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  monthly_amount: z.number().positive().optional(),
  yearly_amount:  z.number().positive().optional(),
  caution_fee_paid: z.number().min(0).default(0),
  agency_fee_paid:  z.number().min(0).default(0),
});

export const signSchema = z.object({
  signature_data: z.string().min(1), // base64 signature image
});

export type CreateTenancyInput = z.infer<typeof createTenancySchema>;
