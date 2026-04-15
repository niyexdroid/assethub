import { z } from 'zod';

export const createComplaintSchema = z.object({
  tenancy_id:  z.string().uuid(),
  category:    z.enum([
    'maintenance','payment_dispute','deposit_dispute',
    'landlord_conduct','noise','listing_misrepresentation','roommate','other'
  ]),
  title:       z.string().min(5).max(255),
  description: z.string().min(10),
  priority:    z.enum(['low','medium','high','critical']).default('medium'),
});

export const addMessageSchema = z.object({
  message:     z.string().min(1),
  attachments: z.array(z.string()).default([]),
});

export const resolveSchema = z.object({
  resolution_notes: z.string().min(5),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
