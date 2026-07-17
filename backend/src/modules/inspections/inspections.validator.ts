import { z } from 'zod';

export const createReportSchema = z.object({
  tenancy_id: z.string().uuid(),
});

export const addItemSchema = z.object({
  item_name:      z.string().min(1).max(255),
  description:    z.string().max(2000).optional(),
  condition:      z.enum(['good', 'fair', 'damaged', 'missing']).default('good'),
  photo_urls:     z.array(z.string()).default([]),
  capture_source: z.enum(['camera']).default('camera'),
  captured_at:    z.string().datetime().optional(),
  notes:          z.string().max(2000).optional(),
});

export const updateItemSchema = z.object({
  condition: z.enum(['good', 'fair', 'damaged', 'missing']).optional(),
  notes:     z.string().max(2000).optional(),
  item_name: z.string().min(1).max(255).optional(),
});

export const signReportSchema = z.object({
  content_hash:   z.string().length(64),
  gps_lat:        z.number().min(-90).max(90).optional(),
  gps_lng:        z.number().min(-180).max(180).optional(),
  gps_captured_at: z.string().datetime().optional(),
});

export const disputeReportSchema = z.object({
  reason: z.string().min(10).max(5000),
});

export type CreateReportInput  = z.infer<typeof createReportSchema>;
export type AddItemInput       = z.infer<typeof addItemSchema>;
export type UpdateItemInput    = z.infer<typeof updateItemSchema>;
export type SignReportInput    = z.infer<typeof signReportSchema>;
export type DisputeReportInput = z.infer<typeof disputeReportSchema>;
