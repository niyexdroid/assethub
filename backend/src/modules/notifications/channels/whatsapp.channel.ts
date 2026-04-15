import { sendchampClient } from '../../../config/sendchamp';
import { env } from '../../../config/env';
import { logger } from '../../../utils/logger';
import type { ChannelResult } from '../../../types/notification.types';

export async function sendWhatsApp(phone: string, body: string): Promise<ChannelResult> {
  const recipient = phone.replace(/^\+/, '');
  try {
    await sendchampClient.post('/whatsapp/message/send', {
      sender_phone_number: env.SENDCHAMP_WHATSAPP_NUMBER,
      recipient,
      message: body,
    });
    return { channel: 'whatsapp', success: true };
  } catch (err: any) {
    const detail = err?.response?.data ?? err?.message;
    logger.warn('WhatsApp notification failed', { phone, error: detail });
    return { channel: 'whatsapp', success: false, error: JSON.stringify(detail) };
  }
}
