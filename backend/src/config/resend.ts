import { Resend } from 'resend';
import { env } from './env';

export const resend       = new Resend(env.RESEND_API_KEY);
export const FROM_EMAIL   = env.RESEND_FROM_EMAIL;
export const FROM_NAME    = 'Niyexdroid PropMan';
