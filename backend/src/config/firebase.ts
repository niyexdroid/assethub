import admin from 'firebase-admin';
import { env } from './env';
import { logger } from '../utils/logger';

let fcmInstance: admin.messaging.Messaging | null = null;

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey:  env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    fcmInstance = admin.messaging();
  } catch (err) {
    logger.warn('Firebase init skipped — invalid credentials. Push notifications disabled.');
  }
}

export const fcm = fcmInstance;
