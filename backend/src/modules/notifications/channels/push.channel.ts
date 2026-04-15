import { fcm } from '../../../config/firebase';
import { logger } from '../../../utils/logger';
import type { ChannelResult } from '../../../types/notification.types';

export async function sendPush(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<ChannelResult> {
  if (!fcm) {
    return { channel: 'push', success: false, error: 'Firebase not configured' };
  }
  try {
    await fcm.send({
      token: fcmToken,
      notification: { title, body },
      data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {},
      android: { priority: 'high' },
      apns:    { payload: { aps: { sound: 'default', badge: 1 } } },
    });
    return { channel: 'push', success: true };
  } catch (err: any) {
    logger.warn('Push notification failed', { error: err.message });
    return { channel: 'push', success: false, error: err.message };
  }
}
