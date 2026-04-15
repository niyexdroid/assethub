import { z } from 'zod';

const propertyBaseSchema = z.object({
  listing_type:       z.enum(['standard', 'student']).default('standard'),
  property_type:      z.enum(['apartment','flat','duplex','self_contain','room','hostel','bedspace','bungalow','house']),
  title:              z.string().min(5).max(255),
  description:        z.string().optional(),
  address:            z.string().min(5),
  lga:                z.string().min(2),
  state:              z.string().default('Lagos'),
  latitude:           z.number().optional(),
  longitude:          z.number().optional(),
  nearest_landmark:   z.string().optional(),
  nearest_university: z.string().optional(),
  bedrooms:           z.number().int().min(0).optional(),
  bathrooms:          z.number().int().min(0).optional(),
  amenities:          z.array(z.string()).default([]),
  monthly_rent:       z.number().positive().optional(),
  yearly_rent:        z.number().positive().optional(),
  caution_fee:        z.number().min(0).default(0),
  agency_fee:         z.number().min(0).default(0),
  tenancy_mode:       z.enum(['monthly','yearly','both']).default('yearly'),
  available_units:    z.number().int().min(1).default(1),
  rules:              z.string().optional(),
  max_occupants:      z.number().int().min(1).optional(),
  gender_preference:  z.enum(['any','male','female']).default('any'),
  is_available:       z.boolean().optional(),
});

export const createPropertySchema = propertyBaseSchema.refine(
  d => d.tenancy_mode === 'yearly'  ? !!d.yearly_rent  :
       d.tenancy_mode === 'monthly' ? !!d.monthly_rent :
       !!d.monthly_rent && !!d.yearly_rent,
  { message: 'Rent amount required for selected tenancy mode' }
);

export const updatePropertySchema = propertyBaseSchema.partial();

export const searchSchema = z.object({
  listing_type:       z.enum(['standard','student']).optional(),
  property_type:      z.string().optional(),
  lga:                z.string().optional(),
  min_rent:           z.coerce.number().optional(),
  max_rent:           z.coerce.number().optional(),
  bedrooms:           z.coerce.number().optional(),
  tenancy_mode:       z.enum(['monthly','yearly','both']).optional(),
  near_university:    z.string().optional(),
  gender_preference:  z.enum(['any','male','female']).optional(),
  lat:                z.coerce.number().optional(),
  lng:                z.coerce.number().optional(),
  radius_km:          z.coerce.number().default(5),
  page:               z.coerce.number().default(1),
  limit:              z.coerce.number().default(20),
  sort:               z.enum(['newest','price_asc','price_desc']).default('newest'),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type SearchInput         = z.infer<typeof searchSchema>;
