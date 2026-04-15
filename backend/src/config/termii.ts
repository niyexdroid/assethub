import axios from 'axios';
import { env } from './env';

export const termiiClient = axios.create({
  baseURL: 'https://api.ng.termii.com/api',
  headers: { 'Content-Type': 'application/json' },
});

export const TERMII_API_KEY    = env.TERMII_API_KEY;
export const TERMII_SENDER_ID  = env.TERMII_SENDER_ID;
export const TERMII_WA_ID      = env.TERMII_WHATSAPP_ID;
