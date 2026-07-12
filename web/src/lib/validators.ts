import { z } from 'zod'

// ── Auth ──────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const loginOtpSchema = z.object({
  login_token: z.string(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export const registerSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['tenant', 'landlord']),
  package: z.enum(['standard', 'student']).optional(),
})

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  new_password: z.string().min(6, 'Password must be at least 6 characters'),
})

// ── Property ──────────────────────────────────────
export const propertySchema = z.object({
  title: z.string().min(3, 'Title is required'),
  address: z.string().min(5, 'Address is required'),
  lga: z.string().min(1, 'LGA is required'),
  property_type: z.string().min(1, 'Property type is required'),
  yearly_rent: z.coerce.number().min(1, 'Rent amount is required').optional(),
  monthly_rent: z.coerce.number().min(1).optional(),
  caution_fee: z.coerce.number().optional(),
  agency_fee: z.coerce.number().optional(),
  bedrooms: z.coerce.number().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
  is_available: z.boolean().optional(),
})

// ── Complaint ─────────────────────────────────────
export const complaintSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  tenancy_id: z.string().optional(),
})

// ── Roommate ──────────────────────────────────────
export const roommateProfileSchema = z.object({
  budget_min: z.coerce.number().min(0).optional(),
  budget_max: z.coerce.number().min(0).optional(),
  preferred_lgas: z.array(z.string()).optional(),
  lifestyle_tags: z.array(z.string()).optional(),
  gender_preference: z.enum(['male', 'female', 'any']).optional(),
  bio: z.string().max(300).optional(),
})

// ── KYC ───────────────────────────────────────────
export const bvnSchema = z.object({
  bvn: z.string().length(11, 'BVN must be 11 digits').regex(/^\d+$/, 'BVN must be numbers only'),
})

export const ninSchema = z.object({
  nin: z.string().length(11, 'NIN must be 11 digits').regex(/^\d+$/, 'NIN must be numbers only'),
})

export const studentKycSchema = z.object({
  school_name: z.string().min(2, 'School name is required'),
  school_email: z.string().email('Enter a valid school email'),
})

// ── Settings ──────────────────────────────────────
export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(6, 'New password must be at least 6 characters'),
})

// ── Tenancy Apply ─────────────────────────────────
export const applyTenancySchema = z.object({
  tenancy_type: z.enum(['monthly', 'yearly']).optional(),
  move_in_date: z.string().optional(),
  message: z.string().max(500).optional(),
})
