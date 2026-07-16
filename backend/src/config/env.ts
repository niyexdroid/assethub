import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const schema = z.object({
  NODE_ENV:              z.enum(['development', 'test', 'production']).default('development'),
  PORT:                  z.string().default('8086'),
  DATABASE_URL:          z.string(),
  REDIS_URL:             z.string(),
  JWT_ACCESS_SECRET:     z.string(),
  JWT_REFRESH_SECRET:    z.string(),
  JWT_ACCESS_EXPIRES:    z.string().default('15m'),
  JWT_REFRESH_EXPIRES:   z.string().default('30d'),
  PAYSTACK_SECRET_KEY:   z.string(),
  PAYSTACK_PUBLIC_KEY:   z.string(),
  SENDCHAMP_API_KEY:        z.string(),
  SENDCHAMP_SENDER_NAME:    z.string().default('AssetHub'),
  SENDCHAMP_WHATSAPP_NUMBER: z.string(),
  FIREBASE_PROJECT_ID:   z.string(),
  FIREBASE_CLIENT_EMAIL: z.string(),
  FIREBASE_PRIVATE_KEY:  z.string(),
  // Email: Brevo (primary) → Resend → generic HTTP API / Plunk (fallback)
  BREVO_API_KEY:          z.string().optional().default(''),
  RESEND_API_KEY:         z.string().optional().default(''),
  MAIL_API_URL:           z.string().url().optional().default(''),
  MAIL_API_KEY:           z.string().optional().default(''),
  MAIL_FROM_EMAIL:        z.string().email(),
  MAIL_FROM_NAME:         z.string().default('AssetHub'),
  IMAGEKIT_PUBLIC_KEY:    z.string(),
  IMAGEKIT_PRIVATE_KEY:   z.string(),
  IMAGEKIT_URL_ENDPOINT:  z.string(),
  ENCRYPTION_KEY:        z.string().length(64, 'Must be 32-byte hex (64 chars)'),
  GOOGLE_CLIENT_ID:       z.string().optional(),
  GOOGLE_CLIENT_SECRET:   z.string().optional(),
  GOOGLE_MAPS_API_KEY:   z.string(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:\n', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
