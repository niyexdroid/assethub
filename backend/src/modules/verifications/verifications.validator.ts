import { z } from 'zod';

const verificationDocTypes = ['utility_bill', 'land_registry', 'property_title'] as const;

export const submitVerificationSchema = z.object({
  verification_type: z.enum(verificationDocTypes),
  document_url: z.string().url(),
});

export const rejectVerificationSchema = z.object({
  reason: z.string().min(10).max(500),
});

export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>;
export type RejectVerificationInput = z.infer<typeof rejectVerificationSchema>;
