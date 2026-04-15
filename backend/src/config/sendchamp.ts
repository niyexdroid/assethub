import axios from 'axios';
import { env } from './env';

export const sendchampClient = axios.create({
  baseURL: 'https://api.sendchamp.com/api/v1',
  headers: {
    'Content-Type':  'application/json',
    'Accept':        'application/json',
    'Authorization': `Bearer ${env.SENDCHAMP_API_KEY}`,
  },
});
