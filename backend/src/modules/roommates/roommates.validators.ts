import { z } from 'zod';

export const roommateProfileSchema = z.object({
  property_id:     z.string().uuid().optional(),
  gender:          z.enum(['male', 'female']).optional(),
  age_range_min:   z.number().int().min(15).max(60).optional(),
  age_range_max:   z.number().int().min(15).max(60).optional(),
  school:          z.string().min(2).optional(),
  department:      z.string().optional(),
  level:           z.string().optional(),
  budget_min:      z.number().min(0).default(0),
  budget_max:      z.number().min(0).default(0),
  sleep_schedule:  z.enum(['early_bird', 'night_owl', 'flexible']).optional(),
  cleanliness:     z.enum(['very_clean', 'clean', 'relaxed']).optional(),
  noise_tolerance: z.enum(['quiet', 'moderate', 'lively']).optional(),
  cooking_habits:  z.enum(['always', 'sometimes', 'never']).optional(),
  smoker:          z.boolean().default(false),
  pets_allowed:    z.boolean().default(false),
  bio:             z.string().max(500).optional().nullable(),
  gender_preference: z.enum(['male', 'female', 'any']).optional(),
  is_active:       z.boolean().optional(),
}).refine(d => !d.age_range_min || !d.age_range_max || d.age_range_min <= d.age_range_max,
  { message: 'age_range_min must be <= age_range_max' }
);

export const matchRequestSchema = z.object({
  recipient_id: z.string().uuid(),
  property_id:  z.string().uuid(),
  message:      z.string().max(300).optional(),
});

export type RoommateProfileInput = z.infer<typeof roommateProfileSchema>;
export type MatchRequestInput    = z.infer<typeof matchRequestSchema>;
